import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentOrchestrationService } from '../finance/payment-orchestration.service';
import { WalletService } from '../finance/wallet.service';
import { DomainEventService } from '../../common/events/domain-event.service';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { TenantSubscriptionEntity, SubscriptionStatus, BillingInterval, SaaSPlanEntity } from '../../database/entities/saas-billing.entity';

export enum SaaSPlan {
  STARTER = 'STARTER',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
  SOVEREIGN = 'SOVEREIGN',
}

@Injectable()
export class SaaSProvisioningService {
  private readonly logger = new Logger(SaaSProvisioningService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    @InjectRepository(TenantSubscriptionEntity)
    private readonly subRepo: Repository<TenantSubscriptionEntity>,
    @InjectRepository(SaaSPlanEntity)
    private readonly planRepo: Repository<SaaSPlanEntity>,
    private readonly payments: PaymentOrchestrationService,
    private readonly wallet: WalletService,
    private readonly eventBus: DomainEventService,
  ) {}

  /**
   * Provisions a new enterprise tenant.
   * "Ultra Master" autonomous onboarding.
   */
  async provisionTenant(tenantName: string, adminEmail: string, plan: SaaSPlan) {
    this.logger.log(`Provisioning ${plan} tenant for ${tenantName} (${adminEmail})`);

    // 1. Create Tenant Record
    const slug = tenantName.toLowerCase().replace(/ /g, '-');
    const tenant = await this.tenantRepo.save(this.tenantRepo.create({
      companyName: tenantName,
      ownerEmail: adminEmail,
      slug,
      status: 'active',
      plan: plan.toLowerCase() as any,
    }));

    // 2. Setup Subscription
    const planEntity = await this.planRepo.findOne({ where: { slug: plan.toLowerCase() } });
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.subRepo.save(this.subRepo.create({
      tenantId: tenant.id,
      planId: planEntity?.id || 'default-plan-id',
      status: SubscriptionStatus.ACTIVE,
      interval: BillingInterval.MONTHLY,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    }));

    // 3. Initialize Wallet & Default Credits
    const initialCredits = plan === SaaSPlan.SOVEREIGN ? 5000 : (plan === SaaSPlan.ENTERPRISE ? 1000 : 100);
    await this.wallet.rechargeTenantCredits(tenant.id, initialCredits, 'SYSTEM', 'PROVISION_CREDITS');

    // 4. Emit Event for downstream module orchestration
    await this.eventBus.publish('TENANT_PROVISIONED', tenant.id, {
      tenantName,
      adminEmail,
      plan,
      provisionedAt: new Date().toISOString(),
    });

    return { tenantId: tenant.id, status: 'PROVISIONED', slug: tenant.slug };
  }

  /**
   * Handles subscription renewals and usage billing.
   */
  async handleSubscriptionLifecycle(tenantId: string, action: 'RENEW' | 'CANCEL' | 'UPGRADE') {
    this.logger.log(`Handling ${action} for tenant=${tenantId}`);
    
    // Integration with Stripe/Razorpay logic
    // ...
  }

  /**
   * Autonomous Provisioning for Sales Conversions.
   */
  async provisionNewTenant(data: { companyName: string; adminEmail: string; plan: string }) {
    this.logger.log(`AI-Triggered Auto-Provisioning for ${data.companyName}`);
    
    // Convert string plan to enum
    const plan = (data.plan.toUpperCase().includes('SOVEREIGN') ? SaaSPlan.SOVEREIGN : SaaSPlan.ENTERPRISE) as SaaSPlan;
    
    return this.provisionTenant(data.companyName, data.adminEmail, plan);
  }

  /**
   * Autonomous Usage Metering.
   * Tracks seats, API calls, and marketplace hires.
   */
  async recordUsage(tenantId: string, metric: 'SEAT' | 'API_CALL' | 'MARKETPLACE_HIRE', amount: number) {
    this.logger.debug(`Metering usage for tenant=${tenantId}: ${metric} +${amount}`);
    // Persist to UsageMeterEntity
  }
}
