import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import {
  PlanFeature,
  PlanCode,
  PlanQuotas,
  resolvePlan,
  planHasFeature,
  withinQuota,
  PLAN_CATALOG,
} from './plan-catalog';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantPlanContext {
  tenantId:        string;
  companyId:       string;
  planCode:        string;
  planName:        string;
  status:          string;       // active | past_due | inactive | trial
  isActive:        boolean;
  isPastDue:       boolean;
  isInGracePeriod: boolean;
  features:        Set<PlanFeature>;
  quotas:          PlanQuotas;
  gracePeriodDays: number;
  expiresAt:       string | null;
}

export interface QuotaCheckResult {
  allowed:      boolean;
  current:      number;
  limit:        number;
  isUnlimited:  boolean;
  message?:     string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache (simple in-process TTL cache — 60s)
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry {
  value:     TenantPlanContext;
  expiresAt: number;
}

const TTL_MS = 60_000;

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PLAN ENFORCEMENT SERVICE
 *
 * The central authority for all subscription-driven access decisions.
 *
 * Responsibilities:
 *   1. Resolve a tenant's active plan from the subscriptions table
 *   2. Gate feature access — throw ForbiddenException if not on plan
 *   3. Check quotas (seat count, jobs, branches, storage)
 *   4. Handle grace period logic for past_due subscriptions
 *   5. Cache plan context per tenant (60s TTL) to reduce DB round-trips
 *
 * Design:
 *   - Reads subscription once per request (cached)
 *   - Never mutates subscription state (read-only, single responsibility)
 *   - All Stripe lifecycle mutations go through StripeWebhookService
 */
@Injectable()
export class PlanEnforcementService {
  private readonly logger = new Logger(PlanEnforcementService.name);
  private readonly cache  = new Map<string, CacheEntry>();

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subRepo: Repository<SubscriptionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ── 1. Resolve plan context ────────────────────────────────────────────────

  /**
   * Resolve the active plan context for a tenant.
   * Result is cached for 60 seconds per tenantId.
   */
  async getTenantPlanContext(tenantId: string): Promise<TenantPlanContext> {
    // Cache hit
    const cached = this.cache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // DB lookup — find the most recent active/trial/past_due subscription
    const sub = await this.subRepo
      .createQueryBuilder('sub')
      .where('sub.tenant_id = :tenantId', { tenantId })
      .andWhere("sub.status IN ('active', 'trial', 'past_due')")
      .orderBy('sub.created_at', 'DESC')
      .getOne();

    const ctx = this.buildContext(tenantId, sub);

    this.cache.set(tenantId, { value: ctx, expiresAt: Date.now() + TTL_MS });
    return ctx;
  }

  /** Invalidate cache when subscription changes (called by StripeWebhookService). */
  invalidateCache(tenantId: string): void {
    this.cache.delete(tenantId);
    this.logger.debug(`[PlanEnforcement] Cache invalidated for tenant=${tenantId}`);
  }

  // ── 2. Feature gate ────────────────────────────────────────────────────────

  /**
   * Assert that the tenant's plan includes the requested feature.
   * Throws ForbiddenException if not — safe to call from guards and services.
   *
   * @param tenantId  UUID of the tenant
   * @param feature   PlanFeature enum value
   */
  async assertFeature(tenantId: string, feature: PlanFeature): Promise<void> {
    const ctx = await this.getTenantPlanContext(tenantId);

    if (!ctx.isActive && !ctx.isInGracePeriod) {
      throw new ForbiddenException(
        `Subscription inactive for tenant ${tenantId}. Renew to access ${feature}.`,
      );
    }

    if (!ctx.features.has(feature)) {
      const planName = PLAN_CATALOG[ctx.planCode as PlanCode]?.name ?? ctx.planCode;
      throw new ForbiddenException(
        `Feature "${feature}" is not available on the ${planName} plan. ` +
        `Upgrade your subscription to unlock this feature.`,
      );
    }

    this.logger.debug(
      `[PlanEnforcement] Feature "${feature}" granted for tenant=${tenantId} plan=${ctx.planCode}`,
    );
  }

  /**
   * Check feature without throwing — for conditional rendering or soft gating.
   */
  async hasFeature(tenantId: string, feature: PlanFeature): Promise<boolean> {
    try {
      const ctx = await this.getTenantPlanContext(tenantId);
      return ctx.isActive && ctx.features.has(feature);
    } catch {
      return false;
    }
  }

  // ── 3. Quota enforcement ───────────────────────────────────────────────────

  /**
   * Check if the tenant is within quota for a given dimension.
   * Does NOT throw — returns a result object for caller to decide.
   */
  async checkQuota(
    tenantId: string,
    quotaKey: keyof PlanQuotas,
    currentCount: number,
  ): Promise<QuotaCheckResult> {
    const ctx   = await this.getTenantPlanContext(tenantId);
    const limit = ctx.quotas[quotaKey] as number;

    if (limit === -1) {
      return { allowed: true, current: currentCount, limit: -1, isUnlimited: true };
    }

    const allowed = currentCount < limit;
    return {
      allowed,
      current:     currentCount,
      limit,
      isUnlimited: false,
      message:     allowed
        ? undefined
        : `Quota exceeded: ${quotaKey} limit is ${limit} on the ${ctx.planName} plan.`,
    };
  }

  /**
   * Assert quota — throws BadRequestException on quota breach.
   */
  async assertQuota(
    tenantId: string,
    quotaKey: keyof PlanQuotas,
    currentCount: number,
  ): Promise<void> {
    const result = await this.checkQuota(tenantId, quotaKey, currentCount);
    if (!result.allowed) {
      throw new BadRequestException(result.message);
    }
  }

  // ── 4. Employee seat enforcement ───────────────────────────────────────────

  /**
   * Convenience: check if adding one more employee is within seat quota.
   * Called by EmployeeService.create().
   */
  async assertEmployeeQuota(tenantId: string): Promise<void> {
    const activeCount = await this.dataSource
      .getRepository('employees')
      .createQueryBuilder('e')
      .where('e.tenant_id = :tenantId', { tenantId })
      .andWhere("e.status = 'active'")
      .getCount();

    await this.assertQuota(tenantId, 'maxEmployees', activeCount);
  }

  // ── 5. Plan summary ────────────────────────────────────────────────────────

  /** Return public-facing plan summary (for billing dashboard). */
  async getPlanSummary(tenantId: string): Promise<{
    planCode:    string;
    planName:    string;
    status:      string;
    expiresAt:   string | null;
    features:    string[];
    quotas:      PlanQuotas;
    gracePeriodDays: number;
  }> {
    const ctx = await this.getTenantPlanContext(tenantId);
    return {
      planCode:        ctx.planCode,
      planName:        ctx.planName,
      status:          ctx.status,
      expiresAt:       ctx.expiresAt,
      features:        Array.from(ctx.features),
      quotas:          ctx.quotas,
      gracePeriodDays: ctx.gracePeriodDays,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildContext(tenantId: string, sub: SubscriptionEntity | null): TenantPlanContext {
    if (!sub) {
      // No subscription — default to STARTER with restricted access
      this.logger.warn(`[PlanEnforcement] No subscription found for tenant=${tenantId} — defaulting to STARTER`);
      const plan = PLAN_CATALOG[PlanCode.STARTER];
      return {
        tenantId,
        companyId:       '',
        planCode:        PlanCode.STARTER,
        planName:        plan.name,
        status:          'inactive',
        isActive:        false,
        isPastDue:       false,
        isInGracePeriod: false,
        features:        new Set<PlanFeature>(),
        quotas:          plan.quotas,
        gracePeriodDays: 0,
        expiresAt:       null,
      };
    }

    // Read plan_code from features JSONB (backward-compat until migration adds column)
    const rawPlanCode = (sub.features as Record<string, unknown>)['planCode'] as string
      ?? this.inferPlanCode(sub.planName);

    const plan         = resolvePlan(rawPlanCode);
    const isPastDue    = sub.status === 'past_due';
    const isActive     = sub.status === 'active' || sub.status === 'trial';
    const graceDays    = plan.gracePeriodDays;

    // Determine grace period status: past_due within grace period still gets access
    let isInGracePeriod = false;
    if (isPastDue && sub.updatedAt) {
      const daysSinceUpdate = (Date.now() - new Date(sub.updatedAt).getTime()) / 86_400_000;
      isInGracePeriod = daysSinceUpdate <= graceDays;
    }

    return {
      tenantId,
      companyId:       sub.companyId,
      planCode:        rawPlanCode,
      planName:        plan.name,
      status:          sub.status,
      isActive:        isActive || isInGracePeriod,
      isPastDue,
      isInGracePeriod,
      features:        isActive || isInGracePeriod ? plan.features : new Set<PlanFeature>(),
      quotas:          plan.quotas,
      gracePeriodDays: graceDays,
      expiresAt:       sub.endDate ?? null,
    };
  }

  /**
   * Infer PlanCode from legacy planName strings (before plan_code column migration).
   */
  private inferPlanCode(planName: string): string {
    const lower = (planName ?? '').toLowerCase();
    if (lower.includes('enterprise'))  return PlanCode.ENTERPRISE;
    if (lower.includes('growth'))      return PlanCode.GROWTH;
    if (lower.includes('unlimited'))   return PlanCode.UNLIMITED;
    return PlanCode.STARTER;
  }
}
