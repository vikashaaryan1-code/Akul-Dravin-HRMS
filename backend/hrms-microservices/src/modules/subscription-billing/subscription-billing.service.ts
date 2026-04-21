import { Injectable } from '@nestjs/common';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { InvoiceEntity } from '../../database/entities/invoice.entity';

type SubscriptionRecord = Pick<
  SubscriptionEntity,
  'id' | 'tenantId' | 'companyId' | 'planName' | 'billingCycle' | 'price' | 'features' | 'startDate' | 'endDate' | 'status' | 'createdAt' | 'updatedAt'
>;

type InvoiceRecord = Pick<
  InvoiceEntity,
  'id' | 'tenantId' | 'subscriptionId' | 'invoiceNumber' | 'amount' | 'currency' | 'dueDate' | 'status' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class SubscriptionBillingService {
  private readonly subscriptions: SubscriptionRecord[] = [
    {
      id: 'SUB-1001',
      tenantId: null,
      companyId: 'COMPANY-001',
      planName: 'Enterprise Growth',
      billingCycle: 'monthly',
      price: '2999.00',
      features: { seats: 150, modules: ['finance', 'payments', 'analytics'] },
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      status: 'active',
      createdAt: new Date('2026-04-01T09:00:00.000Z'),
      updatedAt: new Date('2026-04-01T09:00:00.000Z'),
    },
    {
      id: 'SUB-1002',
      tenantId: null,
      companyId: 'COMPANY-002',
      planName: 'Recruitment Pro',
      billingCycle: 'annual',
      price: '18000.00',
      features: { seats: 60, modules: ['recruitment', 'marketplace'] },
      startDate: '2026-01-15',
      endDate: '2027-01-14',
      status: 'active',
      createdAt: new Date('2026-01-15T11:00:00.000Z'),
      updatedAt: new Date('2026-01-15T11:00:00.000Z'),
    },
  ];

  private readonly invoices: InvoiceRecord[] = [
    {
      id: 'INV-1001',
      tenantId: null,
      subscriptionId: 'SUB-1001',
      invoiceNumber: 'AD-2026-0412',
      amount: '2999.00',
      currency: 'INR',
      dueDate: '2026-04-18',
      status: 'pending',
      createdAt: new Date('2026-04-12T08:30:00.000Z'),
      updatedAt: new Date('2026-04-12T08:30:00.000Z'),
    },
    {
      id: 'INV-1002',
      tenantId: null,
      subscriptionId: 'SUB-1002',
      invoiceNumber: 'AD-2026-0301',
      amount: '18000.00',
      currency: 'INR',
      dueDate: '2026-03-05',
      status: 'paid',
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
      updatedAt: new Date('2026-03-03T16:15:00.000Z'),
    },
  ];

  findAllSubscriptions(): Promise<SubscriptionEntity[]> {
    return Promise.resolve(
      [...this.subscriptions]
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
        .map((record) => ({ ...record })) as SubscriptionEntity[],
    );
  }

  createSubscription(payload: Partial<SubscriptionEntity>): Promise<SubscriptionEntity> {
    const now = new Date();
    const entity: SubscriptionRecord = {
      id: `SUB-${Date.now()}`,
      tenantId: payload.tenantId ?? null,
      companyId: payload.companyId?.trim() || `COMPANY-${this.subscriptions.length + 1}`,
      planName: payload.planName?.trim() || 'Platform Essentials',
      billingCycle: payload.billingCycle?.trim() || 'monthly',
      price: this.toAmountString(payload.price, '2499.00'),
      features: payload.features ?? { seats: 25, modules: ['payments', 'finance'] },
      startDate: payload.startDate?.trim() || now.toISOString().slice(0, 10),
      endDate: payload.endDate ?? null,
      status: payload.status?.trim() || 'active',
      createdAt: now,
      updatedAt: now,
    };

    this.subscriptions.unshift(entity);
    return Promise.resolve({ ...entity } as SubscriptionEntity);
  }

  async updateSubscription(id: string, payload: Partial<SubscriptionEntity>): Promise<SubscriptionEntity | null> {
    const existing = this.subscriptions.find((item) => item.id === id);
    if (!existing) {
      return null;
    }

    existing.companyId = payload.companyId?.trim() || existing.companyId;
    existing.planName = payload.planName?.trim() || existing.planName;
    existing.billingCycle = payload.billingCycle?.trim() || existing.billingCycle;
    existing.price = payload.price !== undefined ? this.toAmountString(payload.price, existing.price) : existing.price;
    existing.features = payload.features ?? existing.features;
    existing.startDate = payload.startDate?.trim() || existing.startDate;
    existing.endDate = payload.endDate !== undefined ? payload.endDate : existing.endDate;
    existing.status = payload.status?.trim() || existing.status;
    existing.updatedAt = new Date();

    return Promise.resolve({ ...existing } as SubscriptionEntity);
  }

  findAllInvoices(): Promise<InvoiceEntity[]> {
    return Promise.resolve(
      [...this.invoices]
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
        .map((record) => ({ ...record })) as InvoiceEntity[],
    );
  }

  createInvoice(payload: Partial<InvoiceEntity>): Promise<InvoiceEntity> {
    const now = new Date();
    const targetSubscriptionId = payload.subscriptionId?.trim() || this.subscriptions[0]?.id || `SUB-${Date.now()}`;
    const entity: InvoiceRecord = {
      id: `INV-${Date.now()}`,
      tenantId: payload.tenantId ?? null,
      subscriptionId: targetSubscriptionId,
      invoiceNumber: payload.invoiceNumber?.trim() || `AD-${now.getFullYear()}-${String(this.invoices.length + 1100).padStart(4, '0')}`,
      amount: this.toAmountString(payload.amount, this.subscriptions.find((item) => item.id === targetSubscriptionId)?.price ?? '2499.00'),
      currency: payload.currency?.trim() || 'INR',
      dueDate: payload.dueDate?.trim() || now.toISOString().slice(0, 10),
      status: payload.status?.trim() || 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.invoices.unshift(entity);
    return Promise.resolve({ ...entity } as InvoiceEntity);
  }

  async updateInvoice(id: string, payload: Partial<InvoiceEntity>): Promise<InvoiceEntity | null> {
    const existing = this.invoices.find((item) => item.id === id);
    if (!existing) {
      return null;
    }

    existing.subscriptionId = payload.subscriptionId?.trim() || existing.subscriptionId;
    existing.invoiceNumber = payload.invoiceNumber?.trim() || existing.invoiceNumber;
    existing.amount = payload.amount !== undefined ? this.toAmountString(payload.amount, existing.amount) : existing.amount;
    existing.currency = payload.currency?.trim() || existing.currency;
    existing.dueDate = payload.dueDate?.trim() || existing.dueDate;
    existing.status = payload.status?.trim() || existing.status;
    existing.updatedAt = new Date();

    return Promise.resolve({ ...existing } as InvoiceEntity);
  }

  private toAmountString(value: unknown, fallback: string): string {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed.toFixed(2);
    }

    return fallback;
  }
}
