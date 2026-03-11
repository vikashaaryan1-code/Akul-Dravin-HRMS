import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest } from '../../database/entities/leave-request.entity';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestRepository: Repository<LeaveRequest>,
  ) {}

  async create(data: any) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = this.leaveRequestRepository.create({
      ...data,
      totalDays,
      status: 'pending',
    });

    return this.leaveRequestRepository.save(leaveRequest);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    return this.leaveRequestRepository.find({ where, relations: ['employee', 'leaveType'], order: { createdAt: 'DESC' } });
  }

  async approve(id: string, approverId: string, remarks?: string) {
    const leaveRequest = await this.leaveRequestRepository.findOne({ where: { id } });
    if (!leaveRequest) throw new Error('Leave request not found');

    leaveRequest.status = 'approved';
    leaveRequest.approverId = approverId ?? '';
    leaveRequest.approverRemarks = remarks ?? '';
    leaveRequest.approvedAt = new Date();

    return this.leaveRequestRepository.save(leaveRequest);
  }

  async reject(id: string, approverId: string, remarks: string) {
    const leaveRequest = await this.leaveRequestRepository.findOne({ where: { id } });
    if (!leaveRequest) throw new Error('Leave request not found');

    leaveRequest.status = 'rejected';
    leaveRequest.approverId = approverId;
    leaveRequest.approverRemarks = remarks;
    leaveRequest.approvedAt = new Date();

    return this.leaveRequestRepository.save(leaveRequest);
  }

  async getBalance(employeeId: string, leaveTypeId: string) {
    const approved = await this.leaveRequestRepository.find({
      where: { employeeId, leaveTypeId, status: 'approved' },
    });
    const used = approved.reduce((sum, req) => sum + parseFloat(req.totalDays.toString()), 0);
    return { used, available: 12 - used };
  }
}
