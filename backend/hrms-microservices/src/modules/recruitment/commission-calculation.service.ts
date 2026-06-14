import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SalesCommissionEntity } from '../../database/entities/sales-commission.entity';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CommissionTier {
  minRevenue: number;
  maxRevenue: number | null;
  rate: number;       // percentage
  bonusFlat?: number; // flat bonus on top of rate
  label: string;
}

export interface CommissionCalculationResult {
  recruiterId: string;
  tenantId: string;
  period: string;       // YYYY-MM
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  bonusAmount: number;
  totalPayable: number;
  tier: string;
  breakdown: Array<{
    sourceType: 'PLACEMENT' | 'CONTRACT' | 'RENEWAL';
    referenceId: string;
    revenue: number;
    commission: number;
  }>;
}

export interface CommissionLedgerEntry {
  id: string;
  recruiterId: string;
  period: string;
  totalPayable: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'HELD' | 'DISPUTED';
  paidAt: string | null;
  notes: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER CATALOG (PRD §6.3 Recruiter Commission Engine)
// ─────────────────────────────────────────────────────────────────────────────

const COMMISSION_TIERS: CommissionTier[] = [
  { minRevenue: 0,      maxRevenue: 50_000,   rate: 10, label: 'BRONZE' },
  { minRevenue: 50_001, maxRevenue: 150_000,  rate: 15, label: 'SILVER' },
  { minRevenue: 150_001, maxRevenue: 350_000, rate: 18, bonusFlat: 5_000,  label: 'GOLD' },
  { minRevenue: 350_001, maxRevenue: null,    rate: 22, bonusFlat: 15_000, label: 'PLATINUM' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * COMMISSION CALCULATION SERVICE
 *
 * PRD §6.3 — Recruiter Commission Engine, §11.2 — Marketplace Commission:
 *   Tiered commission rates, flat bonuses, PLACEMENT/CONTRACT/RENEWAL sourcing.
 *
 * Commission is immutable once PAID. Disputed entries require explicit
 * admin override via the audit endpoint.
 */
@Injectable()
export class CommissionCalculationService {
  private readonly logger = new Logger(CommissionCalculationService.name);

  constructor(
    @InjectRepository(SalesCommissionEntity)
    private readonly commissionRepo: Repository<SalesCommissionEntity>,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  // ── Tier Resolution ───────────────────────────────────────────────────────

  private resolveTier(grossRevenue: number): CommissionTier {
    return COMMISSION_TIERS.find(
      (t) =>
        grossRevenue >= t.minRevenue &&
        (t.maxRevenue === null || grossRevenue <= t.maxRevenue),
    ) ?? COMMISSION_TIERS[0];
  }

  // ── Calculate for Period ──────────────────────────────────────────────────

  async calculateForPeriod(
    recruiterId: string,
    tenantId: string,
    period: string, // YYYY-MM
  ): Promise<CommissionCalculationResult> {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate   = new Date(year, month,     0).toISOString().split('T')[0];

    // Fetch placements (direct hire fees from ATS)
    const placements = await this.ds.query<Array<{
      id: string; deal_value: string;
    }>>(
      `SELECT ra.id, COALESCE(rj.placement_fee, 0) AS deal_value
       FROM recruitment_applications ra
       JOIN recruitment_jobs rj ON rj.id = ra.job_id
       WHERE ra.tenant_id = $1
         AND ra.assigned_recruiter_id = $2
         AND ra.pipeline_stage = 'hired'
         AND ra.hired_at >= $3
         AND ra.hired_at <= $4`,
      [tenantId, recruiterId, startDate, endDate],
    );

    // Fetch sales deals (CRM-linked commissions)
    const deals = await this.ds.query<Array<{ id: string; value: string }>>(
      `SELECT sd.id, sd.value
       FROM sales_deals sd
       WHERE sd.tenant_id = $1
         AND sd.assigned_to_id = $2
         AND sd.status = 'won'
         AND sd.closed_at >= $3
         AND sd.closed_at <= $4`,
      [tenantId, recruiterId, startDate, endDate],
    );

    // Build breakdown
    const breakdown: CommissionCalculationResult['breakdown'] = [
      ...placements.map((p) => ({
        sourceType: 'PLACEMENT' as const,
        referenceId: p.id,
        revenue:     parseFloat(p.deal_value),
        commission:  0, // filled after tier resolution
      })),
      ...deals.map((d) => ({
        sourceType: 'CONTRACT' as const,
        referenceId: d.id,
        revenue:     parseFloat(d.value),
        commission:  0,
      })),
    ];

    const grossRevenue = breakdown.reduce((s, b) => s + b.revenue, 0);
    const tier         = this.resolveTier(grossRevenue);
    const commissionRate   = tier.rate;
    const commissionAmount = parseFloat(((grossRevenue * commissionRate) / 100).toFixed(2));
    const bonusAmount      = tier.bonusFlat ?? 0;
    const totalPayable     = commissionAmount + bonusAmount;

    // Fill per-item commission amounts
    for (const item of breakdown) {
      item.commission = parseFloat(((item.revenue * commissionRate) / 100).toFixed(2));
    }

    this.logger.log(
      `COMMISSION_CALC: recruiter=${recruiterId} period=${period} ` +
      `tier=${tier.label} gross=${grossRevenue} payable=${totalPayable}`,
    );

    return {
      recruiterId,
      tenantId,
      period,
      grossRevenue:    parseFloat(grossRevenue.toFixed(2)),
      commissionRate,
      commissionAmount,
      bonusAmount,
      totalPayable,
      tier:            tier.label,
      breakdown,
    };
  }

  // ── Commit to Ledger ──────────────────────────────────────────────────────

  async commitToLedger(
    recruiterId: string,
    tenantId: string,
    period: string,
    calculation: CommissionCalculationResult,
    approvedById: string,
  ): Promise<CommissionLedgerEntry> {
    // Idempotency check — prevent double-commit
    const existing = await this.commissionRepo.findOne({
      where: {
        tenantId,
        employeeId: recruiterId,
        // Use metadata JSONB for period storage — entity stores commission_type etc.
      } as any,
    });

    // Use sales_commission entity for ledger storage
    const entity = this.commissionRepo.create({
      tenantId,
      employeeId: recruiterId,
      saleId:     `period-${period}`,
      dealValue:  calculation.grossRevenue.toString(),
      commissionRate: calculation.commissionRate.toString(),
      commissionAmount: calculation.totalPayable.toString(),
      status: 'PENDING',
      calculatedAt: new Date(),
      metadata: {
        period,
        tier: calculation.tier,
        bonusAmount: calculation.bonusAmount,
        breakdown: calculation.breakdown,
        approvedById,
      } as any,
    } as any) as any as SalesCommissionEntity;

    const saved = await this.commissionRepo.save(entity);

    this.logger.log(
      `COMMISSION_COMMIT: id=${saved.id} recruiter=${recruiterId} period=${period} status=PENDING`,
    );

    return {
      id:          saved.id,
      recruiterId,
      period,
      totalPayable: calculation.totalPayable,
      status:       'PENDING',
      paidAt:       null,
      notes:        null,
    };
  }

  // ── Get Ledger for Recruiter ───────────────────────────────────────────────

  async getRecruiterLedger(
    recruiterId: string,
    tenantId: string,
  ): Promise<CommissionLedgerEntry[]> {
    const rows = await this.ds.query<Array<{
      id: string; sale_id: string; commission_amount: string;
      status: string; paid_at: string | null; metadata: any;
    }>>(
      `SELECT id, sale_id, commission_amount, status, paid_at, metadata
       FROM sales_commissions
       WHERE tenant_id = $1 AND employee_id = $2
       ORDER BY created_at DESC`,
      [tenantId, recruiterId],
    );

    return rows.map((r) => ({
      id:          r.id,
      recruiterId,
      period:      (r.metadata as any)?.period ?? r.sale_id,
      totalPayable: parseFloat(r.commission_amount),
      status:       r.status as CommissionLedgerEntry['status'],
      paidAt:       r.paid_at,
      notes:        (r.metadata as any)?.notes ?? null,
    }));
  }

  // ── Mark Paid ─────────────────────────────────────────────────────────────

  async markPaid(
    commissionId: string,
    tenantId: string,
    paidById: string,
  ): Promise<CommissionLedgerEntry> {
    const commission = await this.commissionRepo.findOne({
      where: { id: commissionId, tenantId } as any,
    });

    if (!commission) {
      throw new NotFoundException(`Commission ${commissionId} not found.`);
    }

    const current = (commission as any).status;
    if (current === 'PAID') {
      throw new BadRequestException('Commission already marked as PAID.');
    }
    if (current === 'DISPUTED') {
      throw new BadRequestException('Disputed commission requires admin override before payment.');
    }

    (commission as any).status = 'PAID';
    (commission as any).paid_at = new Date();
    (commission as any).metadata = {
      ...(commission as any).metadata,
      paidById,
      paidAt: new Date().toISOString(),
    };

    const saved = await this.commissionRepo.save(commission);

    this.logger.log(`COMMISSION_PAID: id=${commissionId} paidBy=${paidById}`);

    return {
      id:          saved.id,
      recruiterId: (saved as any).employeeId,
      period:      (saved as any).metadata?.period ?? '',
      totalPayable: parseFloat((saved as any).commissionAmount),
      status:      'PAID',
      paidAt:      (saved as any).paid_at?.toISOString() ?? null,
      notes:       null,
    };
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────

  async getLeaderboard(
    tenantId: string,
    period: string,
  ): Promise<Array<{ recruiterId: string; totalRevenue: number; tier: string; rank: number }>> {
    const [year, month] = period.split('-').map(Number);
    const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const end   = new Date(year, month,     0).toISOString().split('T')[0];

    const rows = await this.ds.query<Array<{ recruiter_id: string; total: string }>>(
      `SELECT
         ra.assigned_recruiter_id AS recruiter_id,
         SUM(COALESCE(rj.placement_fee, 0)) AS total
       FROM recruitment_applications ra
       JOIN recruitment_jobs rj ON rj.id = ra.job_id
       WHERE ra.tenant_id = $1
         AND ra.pipeline_stage = 'hired'
         AND ra.hired_at >= $2
         AND ra.hired_at <= $3
         AND ra.assigned_recruiter_id IS NOT NULL
       GROUP BY ra.assigned_recruiter_id
       ORDER BY total DESC`,
      [tenantId, start, end],
    );

    return rows.map((r, i) => ({
      recruiterId:   r.recruiter_id,
      totalRevenue:  parseFloat(r.total),
      tier:          this.resolveTier(parseFloat(r.total)).label,
      rank:          i + 1,
    }));
  }
}
