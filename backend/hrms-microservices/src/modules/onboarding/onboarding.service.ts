import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Onboarding } from './onboarding.entity';

@Injectable()
export class OnboardingService {
  constructor(@InjectRepository(Onboarding) private onboardingRepository: Repository<Onboarding>) {}

  async findAll(): Promise<Onboarding[]> {
    return this.onboardingRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Onboarding | null> {
    return this.onboardingRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Onboarding>): Promise<Onboarding> {
    return this.onboardingRepository.save(this.onboardingRepository.create(data));
  }

  async update(id: string, data: Partial<Onboarding>): Promise<Onboarding | null> {
    await this.onboardingRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.onboardingRepository.delete(id);
  }

  async getStats(): Promise<any> {
    const total = await this.onboardingRepository.count();
    const inProgress = await this.onboardingRepository.count({ where: { status: 'in_progress' } });
    const completed = await this.onboardingRepository.count({ where: { status: 'completed' } });
    return { total, inProgress, completed };
  }
}
