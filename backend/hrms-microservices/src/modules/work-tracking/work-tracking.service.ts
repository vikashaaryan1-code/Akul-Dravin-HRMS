import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';
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
    const activities = await this.activityRepo.find({ take: 500 });
    const totalProductiveHours = activities.reduce((sum, a) => sum + Number(a.productiveHours), 0);
    const totalTasksCompleted = activities.reduce((sum, a) => sum + a.tasksCompleted, 0);
    const avgProductivity = activities.length > 0 ? totalProductiveHours / activities.length : 0;

    return {
      totalActivities: activities.length,
      totalProductiveHours: Math.round(totalProductiveHours * 10) / 10,
      totalTasksCompleted,
      avgProductivityHours: Math.round(avgProductivity * 10) / 10,
    };
  }
}
