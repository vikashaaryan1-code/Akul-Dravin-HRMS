import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Onboarding } from './onboarding.entity';

@Injectable()
export class OnboardingService {
  constructor(@InjectRepository(Onboarding) private onboardingRepository: Repository<Onboarding>) {}

  async findAll(): Promise<Onboarding[]> {
    return this.onboardingRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Onboarding | null> {
    return this.onboardingRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Onboarding>): Promise<Onboarding> {
    return this.onboardingRepository.save(this.onboardingRepository.create(data));
  }

  async update(id: string, data: Partial<Onboarding>): Promise<Onboarding | null> {
    await this.onboardingRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.onboardingRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // ⚡ Bolt: Performance Optimization
    // Consolidating 3 sequential count queries into 1 query using conditional aggregation.
    // Impact: Reduces database round-trips from 3 to 1, significantly lowering latency for stats calculation.
    const stats = await this.onboardingRepository
      .createQueryBuilder('onboarding')
      .select('COUNT(onboarding.id)', 'total')
      .addSelect("SUM(CASE WHEN onboarding.status = 'in_progress' THEN 1 ELSE 0 END)", 'inProgress')
      .addSelect("SUM(CASE WHEN onboarding.status = 'completed' THEN 1 ELSE 0 END)", 'completed')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      inProgress: parseInt(stats.inProgress, 10) || 0,
      completed: parseInt(stats.completed, 10) || 0,
    };
  }
}
