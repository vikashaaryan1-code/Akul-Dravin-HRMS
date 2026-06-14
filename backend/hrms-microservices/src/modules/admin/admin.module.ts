import { Module, Global } from '@nestjs/common';
import { SaaSProvisioningService } from './saas-provisioning.service';
import { UsageMeteringService } from './usage-metering.service';
import { BillingEngineService } from './billing-engine.service';
import { DomainMappingService } from './domain-mapping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaaSPlanEntity, TenantSubscriptionEntity } from '../../database/entities/saas-billing.entity';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { FinanceModule } from '../finance/finance.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([SaaSPlanEntity, TenantSubscriptionEntity, TenantEntity]),
    FinanceModule,
  ],
  providers: [
    SaaSProvisioningService,
    UsageMeteringService,
    BillingEngineService,
    DomainMappingService,
  ],
  exports: [
    SaaSProvisioningService,
    UsageMeteringService,
    BillingEngineService,
    DomainMappingService,
  ],
})
export class AdminModule {}
