import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { MarketingAutomationService } from './marketing-automation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const MARKETING_ROLES = [
  Role.ROOT_OWNER,
  Role.PLATFORM_ADMIN,
  Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN,
  Role.HR_MANAGER,
  Role.SALES_MANAGER,
  Role.TEAM_MANAGER,
  Role.TEAM_LEADER,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
export class MarketingAutomationController {
  constructor(private readonly marketingAutomationService: MarketingAutomationService) {}

  @Get('campaigns')
  @Roles(...MARKETING_ROLES)
  campaigns(@Query('tenantId') tenantId?: string) {
    return this.marketingAutomationService.getCampaigns(tenantId);
  }

  @Get('performance')
  @Roles(...MARKETING_ROLES, Role.EMPLOYEE)
  performance(@Query('tenantId') tenantId?: string) {
    return this.marketingAutomationService.getPerformance(tenantId);
  }

  @Get('campaigns/:id')
  @Roles(...MARKETING_ROLES)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingAutomationService.findOne(id);
  }

  @Post('campaigns')
  @Roles(...MARKETING_ROLES)
  create(@Body() body: Record<string, unknown>) {
    return this.marketingAutomationService.create(
      body as unknown as Parameters<MarketingAutomationService['create']>[0],
    );
  }

  @Patch('campaigns/:id')
  @Roles(...MARKETING_ROLES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.marketingAutomationService.update(
      id,
      body as unknown as Parameters<MarketingAutomationService['update']>[1],
    );
  }

  @Delete('campaigns/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingAutomationService.remove(id);
  }
}
