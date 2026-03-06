import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateProfileEntity } from '../../database/entities/candidate-profile.entity';

@Injectable()
export class CandidateProfilesService {
  constructor(
    @InjectRepository(CandidateProfileEntity)
    private readonly candidateRepository: Repository<CandidateProfileEntity>,
  ) {}

  findAll(): Promise<CandidateProfileEntity[]> {
    return this.candidateRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<CandidateProfileEntity | null> {
    return this.candidateRepository.findOne({ where: { id } });
  }

  create(payload: Partial<CandidateProfileEntity>): Promise<CandidateProfileEntity> {
    const entity = this.candidateRepository.create(payload);
    return this.candidateRepository.save(entity);
  }

  async update(id: string, payload: Partial<CandidateProfileEntity>): Promise<CandidateProfileEntity | null> {
    await this.candidateRepository.update(id, payload);
    return this.findOne(id);
  }
}
