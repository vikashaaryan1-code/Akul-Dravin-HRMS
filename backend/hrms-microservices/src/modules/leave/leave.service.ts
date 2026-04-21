import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { LeaveRequestEntity } from '../../database/entities/leave-request.entity';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { AttendanceService } from '../attendance/attendance.service';
import { TenantContext } from '../../common/context/tenant-context';

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
    private readonly attendanceService: AttendanceService,
  ) {}

  async findAllLeaveTypes(): Promise<LeaveTypeEntity[]> {
    return this.leaveTypeRepo.find({ 
      order: { leaveName: 'ASC' } 
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
      order: { createdAt: 'DESC' } 
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

    return this.leaveRequestRepo.save(entity);
  }

  async updateLeaveRequestStatus(id: string, dto: UpdateLeaveRequestDto): Promise<LeaveRequestEntity> {
    const request = await this.findLeaveRequest(id);

    request.status = dto.status;
    request.approvedBy = dto.approvedBy ?? null;
    request.approvedAt = dto.status === 'approved' ? new Date() : null;

    await this.leaveRequestRepo.save(request);

    if (dto.status === 'approved') {
      await this.syncWithAttendance(request);
    }

    return request;
  }

  private async syncWithAttendance(request: LeaveRequestEntity) {
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const date = new Date(start);

    while (date <= end) {
      const dateString = date.toISOString().split('T')[0];
      try {
        await this.attendanceService.create({
          employeeId: request.employeeId,
          attendanceDate: dateString,
          status: 'leave',
          companyId: 'UNKNOWN_COMPANY_ID', // Should be fetched from request or employee
        });
      } catch (error: any) {
        this.logger.warn(`Attendance sync failed for ${dateString}: ${error.message}`);
      }
      date.setDate(date.getDate() + 1);
    }
  }
}

