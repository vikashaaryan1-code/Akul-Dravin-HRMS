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
    // Optimized: Use conditional aggregation to get all stats in a single database query
    const stats = await this.policyRepository
      .createQueryBuilder('policy')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN policy.status = 'active' THEN 1 ELSE 0 END)", 'active')
      .addSelect("SUM(CASE WHEN policy.requiresAcknowledgment = true THEN 1 ELSE 0 END)", 'requiresAck')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      active: parseInt(stats.active, 10) || 0,
      requiresAck: parseInt(stats.requiresAck, 10) || 0,
    };
  }
}
