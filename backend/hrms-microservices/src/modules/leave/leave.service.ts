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
      status: 'pending',
    });
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

    request.status     = dto.status;
    request.approvedBy = dto.approvedBy ?? null;
    request.approvedAt = dto.status === 'approved' ? new Date() : null;

    await this.leaveRequestRepo.save(request);

    // Audit: approval or rejection
    const auditAction =
      dto.status === 'approved' ? AuditAction.LEAVE_APPROVED : AuditAction.LEAVE_REJECTED;

    await this.auditLog.log(auditAction, {
      tenantId,
      actorId:      dto.approvedBy ?? null,
      resourceType: 'leave_request',
      resourceId:   request.id,
      metadata: {
        employeeId: request.employeeId,
        status:     dto.status,
        startDate:  request.startDate,
        endDate:    request.endDate,
      },
    });

    // Notification: enqueue email to employee when approved or rejected
    if (dto.status === 'approved' || dto.status === 'rejected') {
      await this.enqueueLeaveStatusNotification(request, dto.status, tenantId);
    }

    if (dto.status === 'approved') {
      await this.syncWithAttendance(request);
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
