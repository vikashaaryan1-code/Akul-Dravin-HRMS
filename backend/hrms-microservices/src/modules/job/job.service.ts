import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../database/entities/job.entity';

@Injectable()
export class JobService {
  constructor(@InjectRepository(Job) private jobRepository: Repository<Job>) {}

  private sanitize(data: any) {
    return {
      ...data,
      salaryMin: data.salaryMin !== '' && data.salaryMin != null ? Number(data.salaryMin) : null,
      salaryMax: data.salaryMax !== '' && data.salaryMax != null ? Number(data.salaryMax) : null,
    };
  }

  async create(data: any) {
    const job = this.jobRepository.create({ ...this.sanitize(data), postedDate: new Date() });
    return this.jobRepository.save(job);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.status) where.status = filters.status;
    return this.jobRepository.find({ where, order: { postedDate: 'DESC' } });
  }

  async findOne(id: string) {
    return this.jobRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.jobRepository.update(id, this.sanitize(data));
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.jobRepository.delete(id);
  }
}
