import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { HelpdeskService } from './helpdesk.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const MANAGER_ROLES = [
  Role.ROOT_OWNER,
  Role.PLATFORM_ADMIN,
  Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN,
  Role.HR_MANAGER,
  Role.TEAM_MANAGER,
  Role.TEAM_LEADER,
  Role.SALES_MANAGER,
];

const ALL_ROLES = [...MANAGER_ROLES, Role.EMPLOYEE];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('helpdesk')
export class HelpdeskController {
  constructor(private readonly helpdeskService: HelpdeskService) {}

  // ── List all tickets ────────────────────────────────────────────────────────
  @Get('tickets')
  @Roles(...ALL_ROLES)
  findAll(@Query('tenantId') tenantId?: string) {
    return this.helpdeskService.findAll(tenantId);
  }

  // ── SLA status summary ──────────────────────────────────────────────────────
  @Get('sla-status')
  @Roles(...MANAGER_ROLES)
  slaStatus(@Query('tenantId') tenantId?: string) {
    return this.helpdeskService.getSlaStatus(tenantId);
  }

  // ── Get single ticket ───────────────────────────────────────────────────────
  @Get('tickets/:id')
  @Roles(...ALL_ROLES)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.helpdeskService.findOne(id);
  }

  // ── Tickets by requester ────────────────────────────────────────────────────
  @Get('tickets/by-requester/:requesterId')
  @Roles(...ALL_ROLES)
  byRequester(@Param('requesterId', ParseUUIDPipe) requesterId: string) {
    return this.helpdeskService.findByRequester(requesterId);
  }

  // ── Create ticket ────────────────────────────────────────────────────────────
  @Post('tickets')
  @Roles(...ALL_ROLES)
  create(@Body() body: Record<string, unknown>) {
    return this.helpdeskService.create(body as unknown as Parameters<HelpdeskService['create']>[0]);
  }

  // ── Update ticket ────────────────────────────────────────────────────────────
  @Patch('tickets/:id')
  @Roles(...ALL_ROLES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.helpdeskService.update(id, body as unknown as Parameters<HelpdeskService['update']>[1]);
  }

  // ── Delete ticket (admin only) ───────────────────────────────────────────────
  @Delete('tickets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.helpdeskService.remove(id);
  }
}
