import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Overtime } from '../../database/entities/overtime.entity';

@Injectable()
export class OvertimeService {
  constructor(@InjectRepository(Overtime) private overtimeRepository: Repository<Overtime>) {}

  async create(data: any) {
    const overtime = this.overtimeRepository.create(data);
    return this.overtimeRepository.save(overtime);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    return this.overtimeRepository.find({ where, relations: ['employee'], order: { date: 'DESC' } });
  }

  async approve(id: string, approverId: string) {
    await this.overtimeRepository.update(id, { status: 'approved', approverId });
    return this.overtimeRepository.findOne({ where: { id }, relations: ['employee'] });
  }

  async reject(id: string, approverId: string) {
    await this.overtimeRepository.update(id, { status: 'rejected', approverId });
    return this.overtimeRepository.findOne({ where: { id }, relations: ['employee'] });
  }
}
