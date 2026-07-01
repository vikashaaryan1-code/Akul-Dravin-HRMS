import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from './holiday.entity';

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
  ) {}

  async findAll(): Promise<Holiday[]> {
    return this.holidayRepository.find({ order: { date: 'ASC' } });
  }

  async findOne(id: string): Promise<Holiday> {
    return this.holidayRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Holiday>): Promise<Holiday> {
    const holiday = this.holidayRepository.create(data);
    return this.holidayRepository.save(holiday);
  }

  async update(id: string, data: Partial<Holiday>): Promise<Holiday> {
    await this.holidayRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.holidayRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // ⚡ Bolt: Performance Optimization
    // Consolidating 3 sequential count queries into 1 query using conditional aggregation.
    // Impact: Reduces database round-trips from 3 to 1, significantly lowering latency for stats calculation.
    const stats = await this.holidayRepository
      .createQueryBuilder('holiday')
      .select('COUNT(holiday.id)', 'total')
      .addSelect('SUM(CASE WHEN holiday.isOptional = false THEN 1 ELSE 0 END)', 'mandatory')
      .addSelect('SUM(CASE WHEN holiday.isOptional = true THEN 1 ELSE 0 END)', 'optional')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      mandatory: parseInt(stats.mandatory, 10) || 0,
      optional: parseInt(stats.optional, 10) || 0,
    };
  }
}
