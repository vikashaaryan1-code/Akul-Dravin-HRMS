import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from '../../database/entities/interview.entity';

@Injectable()
export class InterviewService {
  constructor(@InjectRepository(Interview) private interviewRepository: Repository<Interview>) {}

  async create(data: any) {
    const interview = this.interviewRepository.create({ ...data, status: 'scheduled' });
    return this.interviewRepository.save(interview);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.applicationId) where.applicationId = filters.applicationId;
    if (filters.status) where.status = filters.status;
    return this.interviewRepository.find({ where, relations: ['application'], order: { scheduledAt: 'ASC' } });
  }

  async findOne(id: string) {
    return this.interviewRepository.findOne({ where: { id }, relations: ['application'] });
  }

  async updateStatus(id: string, status: string, feedback?: string, rating?: number) {
    const data: any = { status };
    if (feedback) data.feedback = feedback;
    if (rating) data.rating = rating;
    await this.interviewRepository.update(id, data);
    return this.findOne(id);
  }
}
