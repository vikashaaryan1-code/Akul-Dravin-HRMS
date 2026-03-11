import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../database/entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(@InjectRepository(Subscription) private subscriptionRepository: Repository<Subscription>) {}

  async create(data: any) {
    const subscription = this.subscriptionRepository.create(data);
    return this.subscriptionRepository.save(subscription);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.status) where.status = filters.status;
    return this.subscriptionRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.subscriptionRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.subscriptionRepository.update(id, data);
    return this.findOne(id);
  }

  async cancel(id: string) {
    await this.subscriptionRepository.update(id, { status: 'cancelled', autoRenew: false });
    return this.findOne(id);
  }
}
