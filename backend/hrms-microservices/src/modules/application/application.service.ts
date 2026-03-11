import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../../database/entities/application.entity';

@Injectable()
export class ApplicationService {
  constructor(@InjectRepository(Application) private applicationRepository: Repository<Application>) {}

  async create(data: any) {
    const application = this.applicationRepository.create({ ...data, status: 'applied', stage: 'screening' });
    return this.applicationRepository.save(application);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.status) where.status = filters.status;
    return this.applicationRepository.find({ where, relations: ['job'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.applicationRepository.findOne({ where: { id }, relations: ['job'] });
  }

  async updateStatus(id: string, status: string, stage?: string) {
    const data: any = { status };
    if (stage) data.stage = stage;
    await this.applicationRepository.update(id, data);
    return this.findOne(id);
  }
}
