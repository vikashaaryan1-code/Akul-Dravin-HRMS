import { Module } from '@nestjs/common';
import { ProcurementVendorController } from './procurement-vendor.controller';
import { ProcurementVendorService } from './procurement-vendor.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [ProcurementVendorController],
  providers: [ProcurementVendorService, RolesGuard],
  exports: [ProcurementVendorService],
})
export class ProcurementVendorModule {}
