import { Controller, Get, UseGuards } from '@nestjs/common';
import { MarketingAutomationService } from './marketing-automation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
export class MarketingAutomationController {
  constructor(private readonly marketingAutomationService: MarketingAutomationService) {}

  @Get('campaigns')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
  )
  campaigns() {
    return this.marketingAutomationService.getCampaigns();
  }

  @Get('performance')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
    Role.EMPLOYEE,
  )
  performance() {
    return this.marketingAutomationService.getPerformance();
  }
}
