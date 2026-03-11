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
    const total = await this.feedbackRepository.count();
    const pending = await this.feedbackRepository.count({ where: { status: 'pending' } });
    const reviewed = await this.feedbackRepository.count({ where: { status: 'reviewed' } });
    return { total, pending, reviewed };
  }
}
