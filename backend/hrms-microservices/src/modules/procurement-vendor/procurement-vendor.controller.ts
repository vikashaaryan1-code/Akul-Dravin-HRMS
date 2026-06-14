import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ProcurementVendorService,
  CreateVendorDto,
  CreatePurchaseOrderDto,
} from './procurement-vendor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const PROC_READ_ROLES = [
  Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.FINANCE_MANAGER,
];
const PROC_WRITE_ROLES = [
  Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('procurement')
export class ProcurementVendorController {
  constructor(private readonly service: ProcurementVendorService) {}

  @Get('vendors')
  @Roles(...PROC_READ_ROLES)
  getVendors() { return this.service.getVendors(); }

  @Get('vendors/:id')
  @Roles(...PROC_READ_ROLES)
  getVendorById(@Param('id') id: string) { return this.service.getVendorById(id); }

  @Post('vendors')
  @Roles(...PROC_WRITE_ROLES)
  createVendor(@Body() payload: CreateVendorDto) { return this.service.createVendor(payload); }

  @Patch('vendors/:id')
  @Roles(...PROC_WRITE_ROLES)
  updateVendor(@Param('id') id: string, @Body() payload: Partial<CreateVendorDto>) {
    return this.service.updateVendor(id, payload);
  }

  @Delete('vendors/:id')
  @Roles(...PROC_WRITE_ROLES)
  deleteVendor(@Param('id') id: string) { return this.service.deleteVendor(id); }

  @Get('purchase-orders')
  @Roles(...PROC_READ_ROLES)
  getPurchaseOrders() { return this.service.getPurchaseOrders(); }

  @Get('purchase-orders/:id')
  @Roles(...PROC_READ_ROLES)
  getPurchaseOrderById(@Param('id') id: string) { return this.service.getPurchaseOrderById(id); }

  @Post('purchase-orders')
  @Roles(...PROC_WRITE_ROLES)
  createPurchaseOrder(@Body() payload: CreatePurchaseOrderDto) {
    return this.service.createPurchaseOrder(payload);
  }

  @Patch('purchase-orders/:id')
  @Roles(...PROC_WRITE_ROLES)
  updatePurchaseOrder(@Param('id') id: string, @Body() payload: Partial<CreatePurchaseOrderDto>) {
    return this.service.updatePurchaseOrder(id, payload);
  }

  @Patch('purchase-orders/:id/approve')
  @Roles(...PROC_WRITE_ROLES)
  approvePurchaseOrder(
    @Param('id') id: string,
    @Body() body: { approvedBy?: string },
  ) {
    return this.service.approvePurchaseOrder(id, body.approvedBy ?? 'System');
  }

  @Patch('purchase-orders/:id/reject')
  @Roles(...PROC_WRITE_ROLES)
  rejectPurchaseOrder(@Param('id') id: string) {
    return this.service.rejectPurchaseOrder(id);
  }

  @Get('summary')
  @Roles(...PROC_READ_ROLES)
  getSummary() { return this.service.getSummary(); }
}
