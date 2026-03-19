import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobApplication } from '../../database/entities/job-application.entity';

@Injectable()
export class JobApplicationService {
  constructor(
    @InjectRepository(JobApplication)
    private jobApplicationRepository: Repository<JobApplication>,
  ) {}

  async create(data: any) {
    const application = this.jobApplicationRepository.create(data);
    return this.jobApplicationRepository.save(application);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.status) where.status = filters.status;
    return this.jobApplicationRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.jobApplicationRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.jobApplicationRepository.update(id, data);
    return this.findOne(id);
  }
}
