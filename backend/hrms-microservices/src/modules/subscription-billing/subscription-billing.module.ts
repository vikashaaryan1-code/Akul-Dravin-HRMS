import { Module } from '@nestjs/common';
import { SubscriptionBillingController } from './subscription-billing.controller';
import { SubscriptionBillingService } from './subscription-billing.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [SubscriptionBillingController],
  providers: [SubscriptionBillingService, RolesGuard],
  exports: [SubscriptionBillingService],
})
export class SubscriptionBillingModule {}
