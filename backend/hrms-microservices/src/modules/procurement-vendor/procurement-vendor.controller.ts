import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProcurementVendorService } from './procurement-vendor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('procurement')
export class ProcurementVendorController {
  constructor(private readonly procurementVendorService: ProcurementVendorService) {}

  @Get('vendors')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.TEAM_MANAGER,
    Role.SALES_MANAGER,
  )
  vendors() {
    return this.procurementVendorService.getVendors();
  }

  @Get('purchase-orders')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.TEAM_MANAGER,
    Role.SALES_MANAGER,
  )
  purchaseOrders() {
    return this.procurementVendorService.getPurchaseOrders();
  }

  @Get('summary')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.TEAM_MANAGER,
    Role.SALES_MANAGER,
    Role.TEAM_LEADER,
  )
  summary() {
    return this.procurementVendorService.getSummary();
  }
}
