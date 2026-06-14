import {
  Body, Controller, Get, Post, Query, UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RoiService } from './roi.service';
import { WorkforceAnalyticsService } from './workforce-analytics.service';
import { RecruitmentAnalyticsService } from './recruitment-analytics.service';
import { RevenueAnalyticsService } from './revenue-analytics.service';
import { AnalyticsEventEntity } from '../../database/entities/analytics-event.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { TenantContext } from '../../common/context/tenant-context';
import { GovernanceEconomicsService } from '../../common/alerts/governance-economics.service';

const ANALYTICS_ROLES = [
  Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN, Role.HR_MANAGER,
];

/**
 * ANALYTICS CONTROLLER
 *
 * PRD §9 — Advanced Analytics & Reporting.
 * Exposes workforce, recruitment, and revenue analytics endpoints.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService:     AnalyticsService,
    private readonly roiService:            RoiService,
    private readonly workforceAnalytics:    WorkforceAnalyticsService,
    private readonly recruitmentAnalytics:  RecruitmentAnalyticsService,
    private readonly revenueAnalytics:      RevenueAnalyticsService,
    private readonly governanceEconomics:   GovernanceEconomicsService,
  ) {}

  // ── Legacy Events ─────────────────────────────────────────────────────────

  @Get('events')
  @Roles(...ANALYTICS_ROLES)
  findAllEvents() {
    return this.analyticsService.findAllEvents();
  }

  @Post('events')
  @Roles(
    Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.HR_MANAGER,
    Role.RECRUITER, Role.EMPLOYEE,
  )
  createEvent(@Body() payload: Partial<AnalyticsEventEntity>) {
    return this.analyticsService.createEvent(payload);
  }

  @Get('dashboard')
  @Roles(...ANALYTICS_ROLES)
  dashboard() {
    return this.analyticsService.getDashboardSummary();
  }

  // ── ROI ───────────────────────────────────────────────────────────────────

  @Get('roi/departments')
  @Roles(...ANALYTICS_ROLES)
  getDepartmentalROI() {
    return this.roiService.getDepartmentalROI();
  }

  @Get('roi/global')
  @Roles(...ANALYTICS_ROLES)
  getGlobalROI() {
    return this.roiService.getGlobalROI();
  }

  @Post('roi/simulate')
  @Roles(...ANALYTICS_ROLES)
  simulateImpact(
    @Body() payload: { directiveId: string; currentStats: any; directive: any },
  ) {
    return this.roiService.simulateSimulation(
      payload.directiveId, payload.currentStats, payload.directive,
    );
  }

  // ── Workforce Analytics ───────────────────────────────────────────────────

  /**
   * GET /analytics/workforce
   * Full workforce KPI summary: headcount + attrition + tenure + movement.
   */
  @Get('workforce')
  @Roles(...ANALYTICS_ROLES)
  async getWorkforceKpi(
    @CurrentUser() user: { sub: string; tenantId?: string },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = queryTenantId ?? TenantContext.getRequiredTenantId();
    return this.workforceAnalytics.getKpiSummary(tenantId);
  }

  /** GET /analytics/workforce/headcount */
  @Get('workforce/headcount')
  @Roles(...ANALYTICS_ROLES)
  async getHeadcount(@Query('tenantId') tenantId?: string) {
    return this.workforceAnalytics.getHeadcountSnapshot(
      tenantId ?? TenantContext.getRequiredTenantId(),
    );
  }

  /** GET /analytics/workforce/attrition?days=365 */
  @Get('workforce/attrition')
  @Roles(...ANALYTICS_ROLES)
  async getAttrition(
    @Query('tenantId') tenantId?: string,
    @Query('days') days?: string,
  ) {
    return this.workforceAnalytics.getAttritionMetrics(
      tenantId ?? TenantContext.getRequiredTenantId(),
      days ? Math.min(parseInt(days, 10), 730) : 365,
    );
  }

  /** GET /analytics/workforce/tenure */
  @Get('workforce/tenure')
  @Roles(...ANALYTICS_ROLES)
  async getTenure(@Query('tenantId') tenantId?: string) {
    return this.workforceAnalytics.getTenureDistribution(
      tenantId ?? TenantContext.getRequiredTenantId(),
    );
  }

  // ── Recruitment Analytics ─────────────────────────────────────────────────

  /**
   * GET /analytics/recruitment
   * Full recruitment KPI summary: funnel + time-to-hire + pipeline velocity.
   */
  @Get('recruitment')
  @Roles(...ANALYTICS_ROLES)
  async getRecruitmentKpi(@Query('tenantId') tenantId?: string) {
    return this.recruitmentAnalytics.getKpiSummary(
      tenantId ?? TenantContext.getRequiredTenantId(),
    );
  }

  /** GET /analytics/recruitment/funnel?days=90 */
  @Get('recruitment/funnel')
  @Roles(...ANALYTICS_ROLES)
  async getFunnel(
    @Query('tenantId') tenantId?: string,
    @Query('days') days?: string,
  ) {
    return this.recruitmentAnalytics.getFunnelMetrics(
      tenantId ?? TenantContext.getRequiredTenantId(),
      days ? Math.min(parseInt(days, 10), 365) : 90,
    );
  }

  /** GET /analytics/recruitment/time-to-hire */
  @Get('recruitment/time-to-hire')
  @Roles(...ANALYTICS_ROLES)
  async getTimeToHire(@Query('tenantId') tenantId?: string) {
    return this.recruitmentAnalytics.getTimeToHireMetrics(
      tenantId ?? TenantContext.getRequiredTenantId(),
    );
  }

  /** GET /analytics/recruitment/pipeline-velocity */
  @Get('recruitment/pipeline-velocity')
  @Roles(...ANALYTICS_ROLES)
  async getPipelineVelocity(@Query('tenantId') tenantId?: string) {
    return this.recruitmentAnalytics.getPipelineVelocity(
      tenantId ?? TenantContext.getRequiredTenantId(),
    );
  }

  // ── Revenue Analytics ─────────────────────────────────────────────────────

  /**
   * GET /analytics/revenue
   * Full revenue KPI summary: MRR/ARR/ARPU + churn + plan distribution + growth trend.
   * Platform-wide (ROOT_OWNER, PLATFORM_ADMIN, SUPER_ADMIN only).
   */
  @Get('revenue')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN)
  async getRevenueKpi() {
    return this.revenueAnalytics.getKpiSummary();
  }

  /** GET /analytics/revenue/snapshot */
  @Get('revenue/snapshot')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN)
  async getRevenueSnapshot() {
    return this.revenueAnalytics.getRevenueSnapshot();
  }

  /** GET /analytics/revenue/churn?days=30 */
  @Get('revenue/churn')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN)
  async getChurnMetrics(@Query('days') days?: string) {
    return this.revenueAnalytics.getChurnMetrics(
      days ? Math.min(parseInt(days, 10), 90) : 30,
    );
  }

  /** GET /analytics/revenue/growth?months=12 */
  @Get('revenue/growth')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN)
  async getGrowthTrend(@Query('months') months?: string) {
    return this.revenueAnalytics.getGrowthTrend(
      months ? Math.min(parseInt(months, 10), 24) : 12,
    );
  }

  /** GET /analytics/revenue/plans */
  @Get('revenue/plans')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN)
  async getPlanDistribution() {
    return this.revenueAnalytics.getPlanDistribution();
  }

  // ── Governance Analytics ──────────────────────────────────────────────────

  /**
   * GET /analytics/governance
   * Institutional Governance Metrics: Economics, Stability, and Metabolism.
   */
  @Get('governance')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  async getGovernanceMetrics() {
    return this.governanceEconomics.getEconomicsReport();
  }
}
