import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { LeaveRequestEntity } from '../../database/entities/leave-request.entity';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    @InjectRepository(LeaveTypeEntity)
    private readonly leaveTypeRepository: Repository<LeaveTypeEntity>,
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
  ) {}

  findAllLeaveTypes(): Promise<LeaveTypeEntity[]> {
    return this.leaveTypeRepository.find({ order: { createdAt: 'DESC' } });
  }

  createLeaveType(dto: CreateLeaveTypeDto): Promise<LeaveTypeEntity> {
    const entity = this.leaveTypeRepository.create({
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId,
      leaveCode: dto.leaveCode,
      leaveName: dto.leaveName,
      daysPerYear: dto.daysPerYear,
      carryForwardLimit: dto.carryForwardLimit ?? '0',
      encashable: dto.encashable ?? false,
      isActive: true,
    });
    this.logger.log(`Creating leave type ${dto.leaveCode}`);
    return this.leaveTypeRepository.save(entity);
  }

  findAllLeaveRequests(): Promise<LeaveRequestEntity[]> {
    return this.leaveRequestRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findLeaveRequest(id: string): Promise<LeaveRequestEntity> {
    const request = await this.leaveRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Leave request not found: ${id}`);
    }
    return request;
  }

  async createLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequestEntity> {
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be greater than or equal to startDate');
    }

    const entity = this.leaveRequestRepository.create({
      tenantId: dto.tenantId ?? null,
      employeeId: dto.employeeId,
      leaveTypeId: dto.leaveTypeId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays: dto.totalDays,
      reason: dto.reason ?? null,
      status: 'pending',
      approvedBy: null,
      approvedAt: null,
    });

    this.logger.log(`Creating leave request for employee=${dto.employeeId}`);
    return this.leaveRequestRepository.save(entity);
  }

  async updateLeaveRequestStatus(id: string, dto: UpdateLeaveRequestDto): Promise<LeaveRequestEntity> {
    const request = await this.findLeaveRequest(id);

    request.status = dto.status;
    request.approvedBy = dto.approvedBy ?? null;
    request.approvedAt = dto.status === 'approved' ? new Date() : null;

    this.logger.log(`Updating leave request id=${id} status=${dto.status}`);
    await this.leaveRequestRepository.save(request);
    return this.findLeaveRequest(id);
  }
}
