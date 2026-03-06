import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, RolesGuard],
  exports: [FinanceService],
})
export class FinanceModule {}
