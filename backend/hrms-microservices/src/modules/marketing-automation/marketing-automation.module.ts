import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingAutomationController } from './marketing-automation.controller';
import { MarketingAutomationService } from './marketing-automation.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MarketingCampaignEntity } from '../../database/entities/marketing-campaign.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MarketingCampaignEntity])],
  controllers: [MarketingAutomationController],
  providers: [MarketingAutomationService, RolesGuard],
  exports: [MarketingAutomationService],
})
export class MarketingAutomationModule {}
