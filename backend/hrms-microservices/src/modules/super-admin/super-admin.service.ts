import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { AuditService } from '../../common/audit/audit.service';

export interface CreateTenantDto {
  companyName: string;
  ownerEmail: string;
  ownerName?: string;
  plan?: string;
  seatLimit?: number;
}

export interface UpdateTenantDto {
  companyName?: string;
  plan?: string;
  status?: string;
  seatLimit?: number;
  featureFlags?: Record<string, boolean>;
  customDomain?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    private readonly auditService: AuditService,
  ) {}

  async listTenants(opts?: { search?: string; status?: string; plan?: string }) {
    const qb = this.tenantRepo.createQueryBuilder('t').orderBy('t.created_at', 'DESC');
    if (opts?.status) qb.andWhere('t.status = :status', { status: opts.status });
    if (opts?.plan) qb.andWhere('t.plan = :plan', { plan: opts.plan });
    if (opts?.search) qb.andWhere('(t.company_name ILIKE :q OR t.owner_email ILIKE :q)', { q: `%${opts.search}%` });
    return qb.getMany();
  }

  async getTenant(id: string): Promise<TenantEntity> {
    const t = await this.tenantRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException(`Tenant ${id} not found`);
    return t;
  }

  async createTenant(payload: CreateTenantDto, actorId?: string): Promise<TenantEntity> {
    const existing = await this.tenantRepo.findOne({ where: { ownerEmail: payload.ownerEmail } });
    if (existing) throw new ConflictException(`Email ${payload.ownerEmail} already registered`);

    const slug = payload.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const tenant = this.tenantRepo.create({
      slug: `${slug}-${Date.now().toString(36)}`,
      companyName: payload.companyName,
      ownerEmail: payload.ownerEmail,
      ownerName: payload.ownerName ?? null,
      plan: (payload.plan as TenantEntity['plan']) ?? 'starter',
      seatLimit: payload.seatLimit ?? 10,
      status: 'trial',
      trialEndsAt,
      featureFlags: {},
    });
    const saved = await this.tenantRepo.save(tenant);
    await this.auditService.log({ actorId, action: 'TENANT_CREATE', entityType: 'Tenant', entityId: saved.id, newValue: { companyName: saved.companyName } });
    return saved;
  }

  async updateTenant(id: string, payload: UpdateTenantDto, actorId?: string): Promise<TenantEntity> {
    const tenant = await this.getTenant(id);
    const old = { plan: tenant.plan, status: tenant.status, seatLimit: tenant.seatLimit };
    const merged = this.tenantRepo.merge(tenant, payload as Partial<TenantEntity>);
    const saved = await this.tenantRepo.save(merged);
    await this.auditService.log({ actorId, action: 'UPDATE', entityType: 'Tenant', entityId: id, oldValue: old as Record<string, unknown>, newValue: payload as Record<string, unknown> });
    return saved;
  }

  async suspendTenant(id: string, reason: string, actorId?: string): Promise<TenantEntity> {
    const tenant = await this.getTenant(id);
    tenant.status = 'suspended';
    tenant.suspendedAt = new Date();
    tenant.suspendedReason = reason;
    const saved = await this.tenantRepo.save(tenant);
    await this.auditService.log({ actorId, action: 'TENANT_SUSPEND', entityType: 'Tenant', entityId: id, newValue: { reason } });
    return saved;
  }

  async activateTenant(id: string, actorId?: string): Promise<TenantEntity> {
    const tenant = await this.getTenant(id);
    tenant.status = 'active';
    tenant.suspendedAt = null;
    tenant.suspendedReason = null;
    const saved = await this.tenantRepo.save(tenant);
    await this.auditService.log({ actorId, action: 'UPDATE', entityType: 'Tenant', entityId: id, newValue: { status: 'active' } });
    return saved;
  }

  async setFeatureFlags(id: string, flags: Record<string, boolean>, actorId?: string): Promise<TenantEntity> {
    const tenant = await this.getTenant(id);
    const old = tenant.featureFlags;
    tenant.featureFlags = { ...tenant.featureFlags, ...flags };
    const saved = await this.tenantRepo.save(tenant);
    await this.auditService.log({ actorId, action: 'FEATURE_FLAG_CHANGE', entityType: 'Tenant', entityId: id, oldValue: old, newValue: flags });
    return saved;
  }

  /**
   * Returns global system statistics across all tenants.
   * Optimized to use conditional aggregation to reduce database round-trips.
   */
  async getGlobalStats() {
    // 1. Get status counts in a single query using conditional aggregation
    // Optimization: Reduces 4 sequential count queries to 1 single-pass aggregation
    const statusCounts = await this.tenantRepo
      .createQueryBuilder('t')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END)", 'active')
      .addSelect("SUM(CASE WHEN t.status = 'trial' THEN 1 ELSE 0 END)", 'trial')
      .addSelect("SUM(CASE WHEN t.status = 'suspended' THEN 1 ELSE 0 END)", 'suspended')
      .getRawOne();

    // 2. Get plan breakdown (remains a separate query due to GROUP BY requirements)
    const planBreakdown = await this.tenantRepo
      .createQueryBuilder('t')
      .select('t.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.plan')
      .getRawMany();

    return {
      total:     parseInt(statusCounts?.total, 10) || 0,
      active:    parseInt(statusCounts?.active, 10) || 0,
      trial:     parseInt(statusCounts?.trial, 10) || 0,
      suspended: parseInt(statusCounts?.suspended, 10) || 0,
      planBreakdown,
    };
  }
}
