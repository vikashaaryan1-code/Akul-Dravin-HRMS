import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnalyticsEventEntity } from '../../database/entities/analytics-event.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { SalesCommissionEntity } from '../../database/entities/sales-commission.entity';
import { SalesCustomerAccountEntity } from '../../database/entities/sales-customer-account.entity';
import { SalesCustomerContactEntity } from '../../database/entities/sales-customer-contact.entity';
import { SalesDealEntity } from '../../database/entities/sales-deal.entity';
import { SalesLeadEntity } from '../../database/entities/sales-lead.entity';
import { SalesTargetEntity } from '../../database/entities/sales-target.entity';
import { PayrollModule } from '../payroll/payroll.module';
import { SalesAutomationController } from './sales-automation.controller';
import { SalesAutomationService } from './sales-automation.service';
import { AiEngineModule } from '../ai-engine/ai-engine.module';

@Module({
  imports: [
    PayrollModule,
    AiEngineModule,
    TypeOrmModule.forFeature([
      SalesLeadEntity,
      SalesCustomerAccountEntity,
      SalesCustomerContactEntity,
      SalesDealEntity,
      SalesTargetEntity,
      SalesCommissionEntity,
      EmployeeEntity,
      RecruitmentJobEntity,
      RecruitmentApplicationEntity,
      AnalyticsEventEntity,
    ]),
  ],
  controllers: [SalesAutomationController],
  providers: [SalesAutomationService, RolesGuard],
  exports: [SalesAutomationService],
})
export class SalesAutomationModule {}
