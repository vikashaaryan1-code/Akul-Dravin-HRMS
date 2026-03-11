import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionBillingController } from './subscription-billing.controller';
import { SubscriptionBillingService } from './subscription-billing.service';
import { Subscription } from '../../database/entities/subscription.entity';
import { InvoiceEntity } from '../../database/entities/invoice.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, InvoiceEntity])],
  controllers: [SubscriptionBillingController],
  providers: [SubscriptionBillingService, RolesGuard],
  exports: [SubscriptionBillingService],
})
export class SubscriptionBillingModule {}
