import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionBillingController } from './subscription-billing.controller';
import { SubscriptionBillingService } from './subscription-billing.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { PlanEnforcementService } from './plan-enforcement.service';
import { PlanEnforcementGuard } from './plan-enforcement.guard';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { InvoiceEntity } from '../../database/entities/invoice.entity';
import { PaymentEventEntity } from '../../database/entities/payment-event.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

/**
 * SUBSCRIPTION BILLING MODULE
 *
 * Provides:
 *   SubscriptionBillingService — CRUD for subscriptions + invoices
 *   StripeWebhookService       — HMAC-verified event handler (checkout, invoice, cancellation)
 *   PlanEnforcementService     — Feature gate + quota authority (tenant plan context cache)
 *   PlanEnforcementGuard       — @RequireFeature() request guard
 *
 * Export PlanEnforcementService and PlanEnforcementGuard globally so any module
 * can inject them without circular dependencies.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionEntity,
      InvoiceEntity,
      PaymentEventEntity,
    ]),
  ],
  controllers: [
    SubscriptionBillingController,
    StripeWebhookController,
  ],
  providers: [
    SubscriptionBillingService,
    StripeWebhookService,
    PlanEnforcementService,
    PlanEnforcementGuard,
    RolesGuard,
  ],
  exports: [
    SubscriptionBillingService,
    PlanEnforcementService,
    PlanEnforcementGuard,
  ],
})
export class SubscriptionBillingModule {}

