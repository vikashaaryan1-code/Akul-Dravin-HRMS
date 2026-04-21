import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportingService, TrialBalanceReport } from './reporting.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('finance/reporting')
@UseGuards(RolesGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('trial-balance')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getTrialBalance(): Promise<TrialBalanceReport> {
    return await this.reportingService.getTrialBalance();
  }

  @Get('liabilities')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getLiabilityReport(): Promise<any> {
    return await this.reportingService.getLiabilityReport();
  }
}
