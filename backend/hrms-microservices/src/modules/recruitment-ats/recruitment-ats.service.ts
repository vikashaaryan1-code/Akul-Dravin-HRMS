import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';

@Injectable()
export class RecruitmentAtsService {
  constructor(
    @InjectRepository(RecruitmentJobEntity)
    private readonly jobRepository: Repository<RecruitmentJobEntity>,
    @InjectRepository(RecruitmentApplicationEntity)
    private readonly applicationRepository: Repository<RecruitmentApplicationEntity>,
  ) {}

  findAllJobs(): Promise<RecruitmentJobEntity[]> {
    return this.jobRepository.find({ order: { createdAt: 'DESC' } });
  }

  createJob(payload: Partial<RecruitmentJobEntity>): Promise<RecruitmentJobEntity> {
    const entity = this.jobRepository.create(payload);
    return this.jobRepository.save(entity);
  }

  async updateJob(id: string, payload: Partial<RecruitmentJobEntity>): Promise<RecruitmentJobEntity | null> {
    await this.jobRepository.update(id, payload);
    return this.jobRepository.findOne({ where: { id } });
  }

  findAllApplications(): Promise<RecruitmentApplicationEntity[]> {
    return this.applicationRepository.find({ order: { createdAt: 'DESC' } });
  }

  createApplication(payload: Partial<RecruitmentApplicationEntity>): Promise<RecruitmentApplicationEntity> {
    const entity = this.applicationRepository.create(payload);
    return this.applicationRepository.save(entity);
  }

  async updateApplication(
    id: string,
    payload: Partial<RecruitmentApplicationEntity>,
  ): Promise<RecruitmentApplicationEntity | null> {
    await this.applicationRepository.update(id, payload);
    return this.applicationRepository.findOne({ where: { id } });
  }
}
