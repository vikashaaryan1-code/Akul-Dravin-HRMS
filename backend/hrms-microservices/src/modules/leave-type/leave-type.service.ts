import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';

@Injectable()
export class LeaveTypeService {
  constructor(
    @InjectRepository(LeaveTypeEntity)
    private readonly leaveTypeRepository: Repository<LeaveTypeEntity>,
  ) {}

  findAll(): Promise<LeaveTypeEntity[]> {
    return this.leaveTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  findOne(id: string): Promise<LeaveTypeEntity | null> {
    return this.leaveTypeRepository.findOne({ where: { id } });
  }

  async create(dto: CreateLeaveTypeDto): Promise<LeaveTypeEntity> {
    const leaveType = this.leaveTypeRepository.create(dto);
    return this.leaveTypeRepository.save(leaveType);
  }

  async update(id: string, dto: UpdateLeaveTypeDto): Promise<LeaveTypeEntity | null> {
    await this.leaveTypeRepository.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.leaveTypeRepository.update(id, { isActive: false });
  }
}
