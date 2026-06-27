import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from './commission.entity';

@Injectable()
export class CommissionService {
  constructor(@InjectRepository(Commission) private repo: Repository<Commission>) {}
  async findAll(): Promise<Commission[]> { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  async findOne(id: string): Promise<Commission> { return this.repo.findOne({ where: { id } }); }
  async create(data: Partial<Commission>): Promise<Commission> { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Commission>): Promise<Commission> { await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string): Promise<void> { await this.repo.delete(id); }
  async getStats(): Promise<any> {
    // Optimized: Using a single query with conditional aggregation to reduce database round-trips from 3 to 1.
    const stats = await this.repo
      .createQueryBuilder('commission')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN commission.status = 'pending' THEN 1 ELSE 0 END)", 'pending')
      .addSelect("SUM(CASE WHEN commission.status = 'paid' THEN 1 ELSE 0 END)", 'paid')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      pending: parseInt(stats.pending, 10) || 0,
      paid: parseInt(stats.paid, 10) || 0,
    };
  }
}
