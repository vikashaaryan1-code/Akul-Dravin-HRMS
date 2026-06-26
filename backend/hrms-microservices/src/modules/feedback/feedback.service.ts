import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(@InjectRepository(Feedback) private feedbackRepository: Repository<Feedback>) {}

  async findAll(): Promise<Feedback[]> {
    return this.feedbackRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Feedback> {
    return this.feedbackRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Feedback>): Promise<Feedback> {
    return this.feedbackRepository.save(this.feedbackRepository.create(data));
  }

  async update(id: string, data: Partial<Feedback>): Promise<Feedback> {
    await this.feedbackRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.feedbackRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // Optimized: Consolidated 3 database queries into 1 using conditional aggregation
    const stats = await this.feedbackRepository
      .createQueryBuilder('feedback')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN feedback.status = 'pending' THEN 1 ELSE 0 END)", 'pending')
      .addSelect("SUM(CASE WHEN feedback.status = 'reviewed' THEN 1 ELSE 0 END)", 'reviewed')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      pending: parseInt(stats.pending, 10) || 0,
      reviewed: parseInt(stats.reviewed, 10) || 0,
    };
  }
}
