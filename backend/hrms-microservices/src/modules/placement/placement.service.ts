import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Placement } from './placement.entity';

@Injectable()
export class PlacementService {
  constructor(@InjectRepository(Placement) private repo: Repository<Placement>) {}
  async findAll(): Promise<Placement[]> { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  async findOne(id: string): Promise<Placement | null> { return this.repo.findOne({ where: { id } }); }
  async create(data: Partial<Placement>): Promise<Placement> { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Placement>): Promise<Placement | null> { await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string): Promise<void> { await this.repo.delete(id); }
  async getStats(): Promise<any> {
    // Optimized: Use conditional aggregation to get all stats in a single database query
    const stats = await this.repo
      .createQueryBuilder('placement')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN placement.status = 'active' THEN 1 ELSE 0 END)", 'active')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      active: parseInt(stats.active, 10) || 0,
    };
  }
}
