import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { LeaveRequestEntity } from '../../database/entities/leave-request.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { AttendanceService } from '../attendance/attendance.service';
import { TenantContext } from '../../common/context/tenant-context';
import { NotificationService } from '../notification/notification.service';
import { AuditLogService, AuditAction } from '../../common/audit/audit-log.service';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  private get leaveTypeRepo() {
    return TenantContext.getRepository(LeaveTypeEntity);
  }

  private get leaveRequestRepo() {
    return TenantContext.getRepository(LeaveRequestEntity);
  }

  constructor(
    private readonly dataSource: DataSource,
    private readonly attendanceService: AttendanceService,
    private readonly notificationService: NotificationService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAllLeaveTypes(): Promise<LeaveTypeEntity[]> {
    return this.leaveTypeRepo.find({
      order: { leaveName: 'ASC' },
    });
  }

  async createLeaveType(dto: CreateLeaveTypeDto): Promise<LeaveTypeEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const entity = this.leaveTypeRepo.create({
      ...dto,
      tenantId,
      isActive: true,
    });
    return this.leaveTypeRepo.save(entity);
  }

  async findAllLeaveRequests(): Promise<LeaveRequestEntity[]> {
    return this.leaveRequestRepo.find({
      relations: ['employee', 'leaveType'],
      order: { createdAt: 'DESC' },
    });
  }

  async findLeaveRequest(id: string): Promise<LeaveRequestEntity> {
    const request = await this.leaveRequestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Leave request not found: ${id}`);
    }
    return request;
  }

  async createLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequestEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be greater than or equal to startDate');
    }

    const entity = this.leaveRequestRepo.create({
      ...dto,
      tenantId,
      status: 'pending_manager',
      approvalStages: [],
    } as any) as unknown as LeaveRequestEntity;
    const saved = await this.leaveRequestRepo.save(entity);

    // Audit: leave applied
    await this.auditLog.log(AuditAction.LEAVE_APPLIED, {
      tenantId,
      actorId:      saved.employeeId,
      resourceType: 'leave_request',
      resourceId:   saved.id,
      metadata: {
        startDate: saved.startDate,
        endDate:   saved.endDate,
        totalDays: saved.totalDays,
      },
    });

    return saved;
  }

  async updateLeaveRequestStatus(
    id: string,
    dto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequestEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const request = await this.findLeaveRequest(id);
    const actorId = dto.approvedBy || '00000000-0000-0000-0000-000000000000';

    if (dto.status === 'rejected' || dto.status === 'cancelled') {
      const prevStatus = request.status;
      request.status = dto.status;
      request.approvalStages = [
        ...(request.approvalStages || []),
        {
          stage: prevStatus,
          approvedBy: actorId,
          approvedAt: new Date().toISOString(),
          status: dto.status,
        },
      ];

      await this.leaveRequestRepo.save(request);

      await this.auditLog.log(AuditAction.LEAVE_REJECTED, {
        tenantId,
        actorId,
        resourceType: 'leave_request',
        resourceId:   request.id,
        metadata: {
          employeeId: request.employeeId,
          status:     dto.status,
          startDate:  request.startDate,
          endDate:    request.endDate,
        },
      });

      await this.enqueueLeaveStatusNotification(request, dto.status as any, tenantId);
      return request;
    }

    // Process multi-level approval: pending_manager -> pending_hr -> pending_dept_head -> approved
    let nextStatus = 'pending_manager';
    let currentStage = 'manager';

    if (request.status === 'pending_manager' || request.status === 'pending') {
      nextStatus = 'pending_hr';
      currentStage = 'manager';
    } else if (request.status === 'pending_hr') {
      nextStatus = 'pending_dept_head';
      currentStage = 'hr';
    } else if (request.status === 'pending_dept_head') {
      nextStatus = 'approved';
      currentStage = 'dept_head';
      request.approvedBy = dto.approvedBy ?? null;
      request.approvedAt = new Date();
    } else {
      // Already approved or in final state
      return request;
    }

    request.status = nextStatus;
    request.approvalStages = [
      ...(request.approvalStages || []),
      {
        stage: currentStage,
        approvedBy: actorId,
        approvedAt: new Date().toISOString(),
        status: 'approved',
      },
    ];

    await this.leaveRequestRepo.save(request);

    // Audit and Notification for transition/final approval
    const auditAction =
      nextStatus === 'approved' ? AuditAction.LEAVE_APPROVED : AuditAction.LEAVE_APPLIED;

    await this.auditLog.log(auditAction, {
      tenantId,
      actorId,
      resourceType: 'leave_request',
      resourceId:   request.id,
      metadata: {
        employeeId: request.employeeId,
        status:     nextStatus,
        startDate:  request.startDate,
        endDate:    request.endDate,
      },
    });

    if (nextStatus === 'approved') {
      await this.enqueueLeaveStatusNotification(request, 'approved', tenantId);
      await this.syncWithAttendance(request);
    } else {
      // Send intermediate stage transition notification
      try {
        await this.notificationService.create({
          tenantId,
          userId: request.employeeId,
          channel: 'email',
          type: `LEAVE_STAGE_${currentStage.toUpperCase()}`,
          title: `Leave request approved by ${currentStage}`,
          message: `Your leave request has been approved by the ${currentStage} and is now routing to the next level.`,
          status: 'queued',
        });
      } catch (err: any) {
        this.logger.warn(`Failed to enqueue intermediate stage notification: ${err.message}`);
      }
    }

    return request;
  }

  // ─── Notification helper ─────────────────────────────────────────────────

  private async enqueueLeaveStatusNotification(
    request: LeaveRequestEntity,
    status: 'approved' | 'rejected',
    tenantId: string,
  ): Promise<void> {
    try {
      const statusLabel = status === 'approved' ? 'Approved ✅' : 'Rejected ❌';
      const subject   = `Leave Request ${statusLabel}`;
      const htmlBody  = `
        <p>Your leave request from <strong>${request.startDate}</strong> to <strong>${request.endDate}</strong>
        has been <strong>${status}</strong>.</p>
        <p>If you have questions, please contact your HR team.</p>
        <p style="color:#888;font-size:12px;">— Akul Dravin HRMS</p>
      `;

      // Resolve the employee's actual work email from DB
      let recipientEmail: string = process.env.PAYROLL_NOTIFY_EMAIL ?? 'hr@company.com';
      try {
        const employee = await this.dataSource.getRepository(EmployeeEntity).findOne({
          where: { id: request.employeeId, tenantId },
          select: ['workEmail'],
        });
        if (employee?.workEmail) {
          recipientEmail = employee.workEmail;
        } else {
          this.logger.warn(
            `LEAVE_NOTIF_EMAIL_FALLBACK leaveId=${request.id} employeeId=${request.employeeId} ` +
            '— workEmail not found, falling back to PAYROLL_NOTIFY_EMAIL',
          );
        }
      } catch (resolveErr: unknown) {
        const msg = resolveErr instanceof Error ? resolveErr.message : String(resolveErr);
        this.logger.warn(`LEAVE_NOTIF_EMAIL_RESOLVE_FAILED leaveId=${request.id} err=${msg}`);
      }

      // Persist notification record first (for audit trail in notifications table)
      const notifRecord = await this.notificationService.create({
        tenantId,
        userId:  request.employeeId,
        channel: 'email',
        type:    `LEAVE_${status.toUpperCase()}`,
        title:   subject,
        message: `Leave ${status} from ${request.startDate} to ${request.endDate}`,
        status:  'queued',
      });

      await this.notificationService.enqueue(
        notifRecord.id,
        'email',
        {
          to:       recipientEmail,
          subject,
          htmlBody,
          textBody: `Your leave request (${request.startDate} – ${request.endDate}) has been ${status}.`,
        },
        tenantId,
      );
    } catch (err: unknown) {
      // Notification failure must NEVER block the approval flow
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`LEAVE_NOTIF_ENQUEUE_FAILED leaveId=${request.id} err=${msg}`);
    }
  }

  // ─── Attendance sync ─────────────────────────────────────────────────────

  private async syncWithAttendance(request: LeaveRequestEntity) {
    // Resolve the employee's companyId from the database
    let resolvedCompanyId = 'UNKNOWN';
    try {
      const emp = await this.dataSource.getRepository(EmployeeEntity).findOne({
        where: { id: request.employeeId },
        select: ['companyId'],
      });
      if (emp?.companyId) resolvedCompanyId = emp.companyId;
    } catch {
      this.logger.warn(`LEAVE_SYNC: could not resolve companyId for employeeId=${request.employeeId}`);
    }

    const start = new Date(request.startDate);
    const end   = new Date(request.endDate);
    const date  = new Date(start);

    while (date <= end) {
      const dateString = date.toISOString().split('T')[0];
      try {
        await this.attendanceService.create({
          employeeId:     request.employeeId,
          attendanceDate: dateString,
          status:         'leave',
          companyId:      resolvedCompanyId,
        });
      } catch (error: any) {
        this.logger.warn(`Attendance sync failed for ${dateString}: ${error.message}`);
      }
      date.setDate(date.getDate() + 1);
    }
  }
}
