import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './policy.entity';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policy)
    private policyRepository: Repository<Policy>,
  ) {}

  async findAll(): Promise<Policy[]> {
    return this.policyRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Policy | null> {
    return this.policyRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Policy>): Promise<Policy> {
    const policy = this.policyRepository.create(data);
    return this.policyRepository.save(policy);
  }

  async update(id: string, data: Partial<Policy>): Promise<Policy | null> {
    await this.policyRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.policyRepository.delete(id);
  }

  async getStats(): Promise<any> {
    const total = await this.policyRepository.count();
    const active = await this.policyRepository.count({ where: { status: 'active' } });
    const requiresAck = await this.policyRepository.count({ where: { requiresAcknowledgment: true } });
    return { total, active, requiresAck };
  }
}
