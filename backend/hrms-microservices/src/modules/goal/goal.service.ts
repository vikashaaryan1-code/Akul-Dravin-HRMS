import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './goal.entity';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
  ) {}

  async findAll(): Promise<Goal[]> {
    return this.goalRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Goal> {
    return this.goalRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Goal>): Promise<Goal> {
    const goal = this.goalRepository.create(data);
    return this.goalRepository.save(goal);
  }

  async update(id: string, data: Partial<Goal>): Promise<Goal> {
    await this.goalRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.goalRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // ⚡ Bolt: Performance Optimization
    // Consolidating 3 sequential count queries into 1 query using conditional aggregation.
    // Impact: Reduces database round-trips from 3 to 1, significantly lowering latency for stats calculation.
    const stats = await this.goalRepository
      .createQueryBuilder('goal')
      .select('COUNT(goal.id)', 'total')
      .addSelect("SUM(CASE WHEN goal.status = 'in_progress' THEN 1 ELSE 0 END)", 'inProgress')
      .addSelect("SUM(CASE WHEN goal.status = 'completed' THEN 1 ELSE 0 END)", 'completed')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      inProgress: parseInt(stats.inProgress, 10) || 0,
      completed: parseInt(stats.completed, 10) || 0,
    };
  }
}
