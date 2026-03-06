import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceJobEntity } from '../../database/entities/marketplace-job.entity';

@Injectable()
export class JobMarketplaceService {
  constructor(
    @InjectRepository(MarketplaceJobEntity)
    private readonly jobRepository: Repository<MarketplaceJobEntity>,
  ) {}

  findAllJobs(): Promise<MarketplaceJobEntity[]> {
    return this.jobRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOneJob(id: string): Promise<MarketplaceJobEntity | null> {
    return this.jobRepository.findOne({ where: { id } });
  }

  createJob(payload: Partial<MarketplaceJobEntity>): Promise<MarketplaceJobEntity> {
    const entity = this.jobRepository.create(payload);
    return this.jobRepository.save(entity);
  }

  async updateJob(id: string, payload: Partial<MarketplaceJobEntity>): Promise<MarketplaceJobEntity | null> {
    await this.jobRepository.update(id, payload);
    return this.findOneJob(id);
  }
}
