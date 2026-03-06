import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [CrmController],
  providers: [CrmService, RolesGuard],
  exports: [CrmService],
})
export class CrmModule {}
