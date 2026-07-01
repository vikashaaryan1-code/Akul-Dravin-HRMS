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
    // ⚡ Bolt: Performance Optimization
    // Consolidating 3 sequential count queries into 1 query using conditional aggregation.
    // Impact: Reduces database round-trips from 3 to 1, significantly lowering latency for stats calculation.
    const stats = await this.timesheetRepository
      .createQueryBuilder('timesheet')
      .select('COUNT(timesheet.id)', 'total')
      .addSelect("SUM(CASE WHEN timesheet.status = 'pending' THEN 1 ELSE 0 END)", 'pending')
      .addSelect("SUM(CASE WHEN timesheet.status = 'approved' THEN 1 ELSE 0 END)", 'approved')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      pending: parseInt(stats.pending, 10) || 0,
      approved: parseInt(stats.approved, 10) || 0,
    };
  }
}
