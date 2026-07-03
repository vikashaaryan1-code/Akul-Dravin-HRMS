import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BenefitsController } from './benefits.controller';
import { BenefitsService } from './benefits.service';
import { BenefitPlanEntity } from '../../database/entities/benefit-plan.entity';
import { BenefitEnrollmentEntity } from '../../database/entities/benefit-enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BenefitPlanEntity, BenefitEnrollmentEntity])],
  controllers: [BenefitsController],
  providers: [BenefitsService],
  exports: [BenefitsService],
})
export class BenefitsModule {}
