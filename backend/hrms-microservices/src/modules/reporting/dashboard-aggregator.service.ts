import { Injectable } from '@nestjs/common';
import { TrialBalanceService } from './trial-balance.service';
import { StatutoryReportService } from './statutory-report.service';
import { ReconReportService } from './recon-report.service';
import { ForensicAdvisoryService } from '../ai-engine/forensic-advisory.service';
import { DashboardSummaryDto } from './dtos/dashboard-summary.dto';
import { TenantContext } from '../../common/context/tenant-context';
import BigNumber from 'bignumber.js';

@Injectable()
export class DashboardAggregatorService {
  constructor(
    private readonly trialBalanceService: TrialBalanceService,
    private readonly statutoryReportService: StatutoryReportService,
    private readonly reconReportService: ReconReportService,
    private readonly forensicService: ForensicAdvisoryService,
  ) {}

  /**
   * THE CONTROL SURFACE AGGREGATOR
   * Provides a snapshot-consistent view of the entire financial system.
   */
  async getSummary(asOfDate?: Date): Promise<DashboardSummaryDto> {
    const tenantId = TenantContext.getRequiredTenantId();
    const snapshotAt = asOfDate || new Date();

    // 1. Fetch Component Snapshots & Forensic Insights
    const [tb, recon, statutory, forensicAnomalies, forensicWarnings, slaDetails] = await Promise.all([
        this.trialBalanceService.getReport(snapshotAt),
        this.reconReportService.getAnomalySummary(snapshotAt),
        this.statutoryReportService.getComplianceSummary(snapshotAt),
        this.forensicService.detectHardAnomalies(snapshotAt),
        this.forensicService.detectWarnings(snapshotAt),
        this.forensicService.getReconciliationSlaDetails(snapshotAt)
    ]);

    // 2. Compute Segment Statuses
    const delta = new BigNumber(tb.totalDebit).minus(tb.totalCredit);
    const trialBalanceStatus: 'PASS' | 'FAIL' = delta.isZero() ? 'PASS' : 'FAIL';
    
    // Reconciliation Status logic (PASS/WARN/FAIL)
    let reconStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (recon.anomalies.length > 0 || forensicAnomalies.some(a => a.type === 'STALE_RECONCILIATION') || slaDetails.breachedSla > 0) {
        reconStatus = 'FAIL';
    } else if (recon.pendingExternalCount > 0 || forensicWarnings.length > 0) {
        reconStatus = 'WARN';
    }

    // Anomaly Level logic (NONE/LOW/HIGH)
    let anomalyLevel: 'NONE' | 'LOW' | 'HIGH' = 'NONE';
    const totalAnomalies = recon.anomalies.length + forensicAnomalies.length;
    if (totalAnomalies > 5) anomalyLevel = 'HIGH';
    else if (totalAnomalies > 0) anomalyLevel = 'LOW';

    // 3. Aggregate Global Health (Green/Yellow/Red per User Spec)
    let health: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    if (trialBalanceStatus === 'FAIL' || anomalyLevel === 'HIGH' || reconStatus === 'FAIL') {
        health = 'RED';
    } else if (reconStatus === 'WARN' || anomalyLevel === 'LOW' || forensicWarnings.length > 0) {
        health = 'YELLOW';
    }

    // 4. Final Aggregation
    return {
      snapshotAt,
      integrity: {
        health,
        checks: {
          trialBalance: trialBalanceStatus,
          reconciliation: reconStatus,
          anomalies: anomalyLevel,
        },
        totalDebits: tb.totalDebit,
        totalCredits: tb.totalCredit,
        delta: delta.toFixed(4),
      },
      reconciliation: {
        anomalyCount: totalAnomalies,
        withinSLA: slaDetails.withinSla,
        breachedSLA: slaDetails.breachedSla,
        slaMinutes: slaDetails.slaMinutes,
        lastReconciledAt: recon.lastReconciledAt,
      },
      liabilities: statutory.obligations.map(o => ({
        accountCode: o.accountCode,
        account: o.accountName,
        balance: o.closingBalance,
      })),
      payroll: {
        activeBatchesCount: 0, 
        totalPendingNet: '0.0000',
      }
    };
  }
}
