import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcurementVendorController } from './procurement-vendor.controller';
import { ProcurementVendorService } from './procurement-vendor.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { VendorPurchaseOrderEntity } from '../../database/entities/vendor-purchase-order.entity';

import { AuditLogModule } from '../../common/audit/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendorEntity, VendorPurchaseOrderEntity]),
    AuditLogModule,
  ],
  controllers: [ProcurementVendorController],
  providers: [ProcurementVendorService, RolesGuard],
  exports: [ProcurementVendorService],
})
export class ProcurementVendorModule {}
