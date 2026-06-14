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

  async getGlobalStats() {
    const [total, active, trial, suspended] = await Promise.all([
      this.tenantRepo.count(),
      this.tenantRepo.count({ where: { status: 'active' } }),
      this.tenantRepo.count({ where: { status: 'trial' } }),
      this.tenantRepo.count({ where: { status: 'suspended' } }),
    ]);
    const planBreakdown = await this.tenantRepo
      .createQueryBuilder('t')
      .select('t.plan, COUNT(*) as count')
      .groupBy('t.plan')
      .getRawMany();
    return { total, active, trial, suspended, planBreakdown };
  }
}
