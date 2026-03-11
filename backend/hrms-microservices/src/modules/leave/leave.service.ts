import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { LeaveRequest } from '../../database/entities/leave-request.entity';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    @InjectRepository(LeaveTypeEntity)
    private readonly leaveTypeRepository: Repository<LeaveTypeEntity>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
  ) {}

  findAllLeaveTypes(): Promise<LeaveTypeEntity[]> {
    return this.leaveTypeRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createLeaveType(dto: CreateLeaveTypeDto): Promise<LeaveTypeEntity> {
    const entity = this.leaveTypeRepository.create({
      companyId: dto.companyId,
      code: dto.leaveCode,
      name: dto.leaveName,
      daysPerYear: Number(dto.daysPerYear),
      isActive: true,
    });
    this.logger.log(`Creating leave type ${dto.leaveCode}`);
    return this.leaveTypeRepository.save(entity);
  }

  findAllLeaveRequests(): Promise<LeaveRequest[]> {
    return this.leaveRequestRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findLeaveRequest(id: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Leave request not found: ${id}`);
    }
    return request;
  }

  async createLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be greater than or equal to startDate');
    }

    const entity = this.leaveRequestRepository.create({
      employeeId: dto.employeeId,
      leaveTypeId: dto.leaveTypeId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays: Number(dto.totalDays),
      reason: dto.reason ?? '',
      status: 'pending',
    });

    this.logger.log(`Creating leave request for employee=${dto.employeeId}`);
    return this.leaveRequestRepository.save(entity);
  }

  async updateLeaveRequestStatus(id: string, dto: UpdateLeaveRequestDto): Promise<LeaveRequest> {
    const request = await this.findLeaveRequest(id);

    request.status = dto.status;
    if (dto.approvedBy) request.approverId = dto.approvedBy;
    if (dto.status === 'approved') request.approvedAt = new Date();

    this.logger.log(`Updating leave request id=${id} status=${dto.status}`);
    await this.leaveRequestRepository.save(request);
    return this.findLeaveRequest(id);
  }
}
