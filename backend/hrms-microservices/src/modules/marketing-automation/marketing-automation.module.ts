import { Module } from '@nestjs/common';
import { MarketingAutomationController } from './marketing-automation.controller';
import { MarketingAutomationService } from './marketing-automation.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [MarketingAutomationController],
  providers: [MarketingAutomationService, RolesGuard],
  exports: [MarketingAutomationService],
})
export class MarketingAutomationModule {}
