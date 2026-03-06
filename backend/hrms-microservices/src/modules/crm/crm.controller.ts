import { Controller, Get, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('leads')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
    Role.RECRUITER,
  )
  leads() {
    return this.crmService.getLeads();
  }

  @Get('customers')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
    Role.RECRUITER,
  )
  customers() {
    return this.crmService.getCustomers();
  }

  @Get('interactions')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
    Role.RECRUITER,
    Role.EMPLOYEE,
  )
  interactions() {
    return this.crmService.getInteractions();
  }
}
