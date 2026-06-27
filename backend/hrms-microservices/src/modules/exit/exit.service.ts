import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exit } from './exit.entity';

@Injectable()
export class ExitService {
  constructor(@InjectRepository(Exit) private exitRepository: Repository<Exit>) {}

  async findAll(): Promise<Exit[]> {
    return this.exitRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Exit> {
    return this.exitRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Exit>): Promise<Exit> {
    return this.exitRepository.save(this.exitRepository.create(data));
  }

  async update(id: string, data: Partial<Exit>): Promise<Exit> {
    await this.exitRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.exitRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // Optimized: Using a single query with conditional aggregation to reduce database round-trips from 3 to 1.
    const stats = await this.exitRepository
      .createQueryBuilder('exit')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN exit.status = 'pending' THEN 1 ELSE 0 END)", 'pending')
      .addSelect("SUM(CASE WHEN exit.status = 'completed' THEN 1 ELSE 0 END)", 'completed')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      pending: parseInt(stats.pending, 10) || 0,
      completed: parseInt(stats.completed, 10) || 0,
    };
  }
}
