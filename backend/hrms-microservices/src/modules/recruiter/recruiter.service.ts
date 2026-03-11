import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recruiter } from '../../database/entities/recruiter.entity';

@Injectable()
export class RecruiterService {
  constructor(@InjectRepository(Recruiter) private recruiterRepository: Repository<Recruiter>) {}

  async create(data: any) {
    const recruiter = this.recruiterRepository.create(data);
    return this.recruiterRepository.save(recruiter);
  }

  async findAll() {
    return this.recruiterRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.recruiterRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.recruiterRepository.update(id, data);
    return this.findOne(id);
  }

  async upgradePlan(id: string, planType: string, jobPostsLimit: number, commissionRate: number) {
    await this.recruiterRepository.update(id, { planType, jobPostsLimit, commissionRate });
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.recruiterRepository.delete(id);
  }
}
