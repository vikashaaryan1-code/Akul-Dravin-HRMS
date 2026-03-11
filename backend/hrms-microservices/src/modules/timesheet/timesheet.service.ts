import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timesheet } from './timesheet.entity';

@Injectable()
export class TimesheetService {
  constructor(
    @InjectRepository(Timesheet)
    private timesheetRepository: Repository<Timesheet>,
  ) {}

  async findAll(): Promise<Timesheet[]> {
    return this.timesheetRepository.find({ order: { date: 'DESC' } });
  }

  async findOne(id: string): Promise<Timesheet | null> {
    return this.timesheetRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Timesheet>): Promise<Timesheet> {
    const timesheet = this.timesheetRepository.create(data);
    return this.timesheetRepository.save(timesheet);
  }

  async update(id: string, data: Partial<Timesheet>): Promise<Timesheet | null> {
    await this.timesheetRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.timesheetRepository.delete(id);
  }

  async approve(id: string, approverId: string): Promise<Timesheet | null> {
    await this.timesheetRepository.update(id, {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
    });
    return this.findOne(id);
  }

  async getStats(): Promise<any> {
    const total = await this.timesheetRepository.count();
    const pending = await this.timesheetRepository.count({ where: { status: 'pending' } });
    const approved = await this.timesheetRepository.count({ where: { status: 'approved' } });
    return { total, pending, approved };
  }
}
