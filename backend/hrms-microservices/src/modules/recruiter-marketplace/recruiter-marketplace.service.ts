import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruiterProfileEntity } from '../../database/entities/recruiter-profile.entity';

@Injectable()
export class RecruiterMarketplaceService {
  constructor(
    @InjectRepository(RecruiterProfileEntity)
    private readonly recruiterRepository: Repository<RecruiterProfileEntity>,
  ) {}

  findAllProfiles(): Promise<RecruiterProfileEntity[]> {
    return this.recruiterRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOneProfile(id: string): Promise<RecruiterProfileEntity | null> {
    return this.recruiterRepository.findOne({ where: { id } });
  }

  createProfile(payload: Partial<RecruiterProfileEntity>): Promise<RecruiterProfileEntity> {
    const entity = this.recruiterRepository.create(payload);
    return this.recruiterRepository.save(entity);
  }

  async updateProfile(id: string, payload: Partial<RecruiterProfileEntity>): Promise<RecruiterProfileEntity | null> {
    await this.recruiterRepository.update(id, payload);
    return this.findOneProfile(id);
  }
}
