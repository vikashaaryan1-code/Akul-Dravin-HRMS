import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../database/entities/job.entity';

@Injectable()
export class JobService {
  constructor(@InjectRepository(Job) private jobRepository: Repository<Job>) {}

  async create(data: any) {
    const job = this.jobRepository.create({ ...data, postedDate: new Date() });
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
    await this.jobRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.jobRepository.delete(id);
  }
}
