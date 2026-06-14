import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CrmLeadEntity } from '../../database/entities/crm-lead.entity';
import { CrmCustomerEntity } from '../../database/entities/crm-customer.entity';
import { CrmInteractionEntity } from '../../database/entities/crm-interaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmLeadEntity, CrmCustomerEntity, CrmInteractionEntity]),
  ],
  controllers: [CrmController],
  providers: [CrmService, RolesGuard],
  exports: [CrmService],
})
export class CrmModule {}
