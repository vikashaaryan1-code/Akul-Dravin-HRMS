import {
  Controller, Get, Post, Param, Body, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { LocationTrackingService } from './location-tracking.service';
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('location-tracking')
export class LocationTrackingController {
  constructor(private readonly locationTrackingService: LocationTrackingService) {}

  // ── Current snapshot (latest ping per employee) ─────────────────────────────
  @Get('current')
  @Roles(...MANAGER_ROLES)
  current(@Query('tenantId') tenantId?: string) {
    return this.locationTrackingService.current(tenantId);
  }

  // ── Zone distribution for last N days ───────────────────────────────────────
  @Get('history')
  @Roles(...MANAGER_ROLES, Role.EMPLOYEE)
  history(
    @Query('tenantId') tenantId?: string,
    @Query('days') days?: string,
  ) {
    return this.locationTrackingService.historyDistribution(
      tenantId,
      days ? parseInt(days, 10) : 7,
    );
  }

  // ── Pings for a specific employee ────────────────────────────────────────────
  @Get('employee/:employeeId')
  @Roles(...MANAGER_ROLES, Role.EMPLOYEE)
  byEmployee(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('limit') limit?: string,
  ) {
    return this.locationTrackingService.findByEmployee(
      employeeId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // ── Record a new ping (called by mobile/browser client) ──────────────────────
  @Post('ping')
  @Roles(...MANAGER_ROLES, Role.EMPLOYEE)
  record(@Body() body: Record<string, unknown>) {
    return this.locationTrackingService.record(
      body as unknown as Parameters<LocationTrackingService['record']>[0],
    );
  }
}
