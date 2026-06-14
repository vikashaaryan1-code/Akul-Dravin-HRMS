import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantSubscriptionEntity, SubscriptionStatus } from '../../database/entities/saas-billing.entity';
import { UsageMeteringService, MeteredMetric } from './usage-metering.service';
import { WalletService } from '../finance/wallet.service';
import { PaymentOrchestrationService } from '../finance/payment-orchestration.service';

@Injectable()
export class BillingEngineService {
  private readonly logger = new Logger(BillingEngineService.name);

  constructor(
    @InjectRepository(TenantSubscriptionEntity)
    private readonly subscriptionRepo: Repository<TenantSubscriptionEntity>,
    private readonly usageMeter: UsageMeteringService,
    private readonly wallet: WalletService,
    private readonly payments: PaymentOrchestrationService,
  ) {}

  /**
   * Generates and executes monthly billing for a tenant.
   * "Fully Automatic" A2Z Invoicing.
   */
  async processMonthlyBilling(tenantId: string) {
    this.logger.log(`Initiating monthly billing execution for tenant=${tenantId}`);

    const subscription = await this.subscriptionRepo.findOne({ 
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan']
    });

    if (!subscription) {
      this.logger.warn(`No active subscription found for tenant=${tenantId}`);
      return;
    }

    // 1. Calculate Base + Seat Price
    const baseTotal = Number(subscription.plan.basePrice) + (subscription.seatCount * Number(subscription.plan.perEmployeePrice));

    // 2. Calculate Usage Charges (AI, Marketplace, etc.)
    const usage = await this.usageMeter.getTenantUsage(tenantId);
    let usageTotal = 0;
    
    // Example: $0.05 per AI Action
    usageTotal += (parseInt(usage[MeteredMetric.AI_TOKENS] || '0') * 0.05);
    // Example: $399 per Marketplace Hire
    usageTotal += (parseInt(usage[MeteredMetric.MARKETPLACE_HIRES] || '0') * 399);

    const grandTotal = baseTotal + usageTotal;

    this.logger.log(`Total Invoice for tenant=${tenantId}: $${grandTotal.toFixed(2)}`);

    // 3. Attempt Payment (Wallet first, then Gateway)
    const deduction = await this.wallet.deductTenantCredits(tenantId, grandTotal, `Monthly Subscription Renewal: ${subscription.plan.name}`);
    
    if (deduction.success) {
      this.logger.log(`Billing successful via Wallet for tenant=${tenantId}`);
      await this.updateSubscriptionPeriod(subscription);
    } else {
      this.logger.warn(`Wallet insufficient for tenant=${tenantId}. Triggering Gateway fallback...`);
      // Trigger Stripe/Razorpay logic via PaymentOrchestrationService
      await this.payments.triggerSubscriptionCharge(tenantId, grandTotal);
    }
  }

  private async updateSubscriptionPeriod(subscription: TenantSubscriptionEntity) {
    const nextMonth = new Date(subscription.currentPeriodEnd);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    subscription.currentPeriodStart = subscription.currentPeriodEnd;
    subscription.currentPeriodEnd = nextMonth;
    await this.subscriptionRepo.save(subscription);
  }
}
