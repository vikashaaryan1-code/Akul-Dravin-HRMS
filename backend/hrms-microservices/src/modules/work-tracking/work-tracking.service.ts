import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';
import { WorkActivityEntity } from '../../database/entities/work-activity.entity';
import { WorkdaySummaryEntity } from '../../database/entities/workday-summary.entity';

export interface CreateActivityDto {
  employeeId: string;
  projectName?: string;
  date?: string;
  loginAt?: string;
  logoutAt?: string;
  tasksCompleted?: number;
  productiveHours?: number;
}

export interface CreateWorkdaySummaryDto {
  employeeId: string;
  employeeName?: string;
  month: string;
  presentDays?: number;
  absentDays?: number;
  paidLeave?: number;
  unpaidLeave?: number;
  wfhDays?: number;
  overtimeHours?: number;
}

@Injectable()
export class WorkTrackingService {
  private get activityRepo() {
    return TenantContext.getRepository(WorkActivityEntity);
  }

  private get workdayRepo() {
    return TenantContext.getRepository(WorkdaySummaryEntity);
  }

  // ── Activities ──────────────────────────────────────────────────────────────

  async getActivities(limit = 50): Promise<WorkActivityEntity[]> {
    return this.activityRepo.find({
      order: { date: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  async getActivityById(id: string): Promise<WorkActivityEntity> {
    const record = await this.activityRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Work activity ${id} not found`);
    return record;
  }

  async createActivity(payload: CreateActivityDto): Promise<WorkActivityEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const activity = this.activityRepo.create({
      tenantId,
      employeeId: payload.employeeId,
      projectName: payload.projectName ?? null,
      date: payload.date ?? new Date().toISOString().split('T')[0],
      loginAt: payload.loginAt ?? null,
      logoutAt: payload.logoutAt ?? null,
      tasksCompleted: payload.tasksCompleted ?? 0,
      productiveHours: payload.productiveHours ?? 0,
    });
    return this.activityRepo.save(activity);
  }

  async updateActivity(id: string, payload: Partial<CreateActivityDto>): Promise<WorkActivityEntity> {
    const activity = await this.getActivityById(id);
    const merged = this.activityRepo.merge(activity, payload as Partial<WorkActivityEntity>);
    return this.activityRepo.save(merged);
  }

  // ── Workday Summaries ────────────────────────────────────────────────────────

  async getWorkdays(month?: string): Promise<WorkdaySummaryEntity[]> {
    const where: Record<string, unknown> = {};
    if (month) where['month'] = month;
    return this.workdayRepo.find({
      where,
      order: { month: 'DESC', employeeName: 'ASC' },
    });
  }

  async upsertWorkdaySummary(payload: CreateWorkdaySummaryDto): Promise<WorkdaySummaryEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const existing = await this.workdayRepo.findOne({
      where: { tenantId, employeeId: payload.employeeId, month: payload.month },
    });

    if (existing) {
      const merged = this.workdayRepo.merge(existing, payload as Partial<WorkdaySummaryEntity>);
      return this.workdayRepo.save(merged);
    }

    const summary = this.workdayRepo.create({
      tenantId,
      employeeId: payload.employeeId,
      employeeName: payload.employeeName ?? null,
      month: payload.month,
      presentDays: payload.presentDays ?? 0,
      absentDays: payload.absentDays ?? 0,
      paidLeave: payload.paidLeave ?? 0,
      unpaidLeave: payload.unpaidLeave ?? 0,
      wfhDays: payload.wfhDays ?? 0,
      overtimeHours: payload.overtimeHours ?? 0,
    });
    return this.workdayRepo.save(summary);
  }

  // ── Analytics ────────────────────────────────────────────────────────────────

  async getProductivitySummary() {
    const tenantId = TenantContext.getRequiredTenantId();

    // ⚡ Bolt Optimization: Replace in-memory array fetching (take: 500) and JS reduction
    // with database-level SQL aggregation (COUNT, SUM, AVG) enforced via TenantQueryPolicy.
    const qb = this.activityRepo.createQueryBuilder('activity');
    TenantQueryPolicy.enforce(qb, tenantId, 'activity', 'WorkTrackingService', 'getProductivitySummary');

    const rawResult = await qb
      .select('COUNT(activity.id)', 'totalActivities')
      .addSelect('COALESCE(SUM(activity.productiveHours), 0)', 'totalProductiveHours')
      .addSelect('COALESCE(SUM(activity.tasksCompleted), 0)', 'totalTasksCompleted')
      .addSelect('COALESCE(AVG(activity.productiveHours), 0)', 'avgProductivityHours')
      .getRawOne();

    const totalActivities = parseInt(rawResult?.totalActivities || '0', 10);
    const totalProductiveHours = parseFloat(rawResult?.totalProductiveHours || '0');
    const totalTasksCompleted = parseInt(rawResult?.totalTasksCompleted || '0', 10);
    const avgProductivity = parseFloat(rawResult?.avgProductivityHours || '0');

    return {
      totalActivities,
      totalProductiveHours: Math.round(totalProductiveHours * 10) / 10,
      totalTasksCompleted,
      avgProductivityHours: Math.round(avgProductivity * 10) / 10,
    };
  }
}
