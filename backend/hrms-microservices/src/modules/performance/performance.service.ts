import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceReview } from '../../database/entities/performance-review.entity';

@Injectable()
export class PerformanceService {
  constructor(@InjectRepository(PerformanceReview) private reviewRepository: Repository<PerformanceReview>) {}

  async create(data: any) {
    const review = this.reviewRepository.create(data);
    return this.reviewRepository.save(review);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    return this.reviewRepository.find({ where, relations: ['employee'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.reviewRepository.findOne({ where: { id }, relations: ['employee'] });
  }

  async update(id: string, data: any) {
    await this.reviewRepository.update(id, data);
    return this.findOne(id);
  }

  async submit(id: string) {
    await this.reviewRepository.update(id, { status: 'submitted' });
    return this.findOne(id);
  }
}
