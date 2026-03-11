import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../database/entities/subscription.entity';
import { InvoiceEntity } from '../../database/entities/invoice.entity';

@Injectable()
export class SubscriptionBillingService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
  ) {}

  findAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({ order: { createdAt: 'DESC' } });
  }

  createSubscription(payload: Partial<Subscription>): Promise<Subscription> {
    const entity = this.subscriptionRepository.create(payload);
    return this.subscriptionRepository.save(entity);
  }

  async updateSubscription(id: string, payload: Partial<Subscription>): Promise<Subscription | null> {
    const existing = await this.subscriptionRepository.findOne({ where: { id } });
    if (!existing) {
      return null;
    }

    const merged = this.subscriptionRepository.merge(existing, payload);
    return this.subscriptionRepository.save(merged);
  }

  findAllInvoices(): Promise<InvoiceEntity[]> {
    return this.invoiceRepository.find({ order: { createdAt: 'DESC' } });
  }

  createInvoice(payload: Partial<InvoiceEntity>): Promise<InvoiceEntity> {
    const entity = this.invoiceRepository.create(payload);
    return this.invoiceRepository.save(entity);
  }

  async updateInvoice(id: string, payload: Partial<InvoiceEntity>): Promise<InvoiceEntity | null> {
    const existing = await this.invoiceRepository.findOne({ where: { id } });
    if (!existing) {
      return null;
    }

    const merged = this.invoiceRepository.merge(existing, payload);
    return this.invoiceRepository.save(merged);
  }
}
