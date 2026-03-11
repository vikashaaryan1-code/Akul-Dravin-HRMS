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
    const total = await this.holidayRepository.count();
    const mandatory = await this.holidayRepository.count({ where: { isOptional: false } });
    const optional = await this.holidayRepository.count({ where: { isOptional: true } });
    return { total, mandatory, optional };
  }
}
