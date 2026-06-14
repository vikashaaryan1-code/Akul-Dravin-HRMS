import { Injectable, Logger } from '@nestjs/common';
import { GovernanceEconomicsService } from './governance-economics.service';

/**
 * GOVERNANCE BUDGET SERVICE — Phase Σ
 * 
 * Enforces operational quotas for the governance layer.
 * Implements "Governance Throttling" to prevent the regulator 
 * from consuming excessive system resources.
 */
@Injectable()
export class GovernanceBudgetService {
  private readonly logger = new Logger(GovernanceBudgetService.name);

  constructor(private readonly economics: GovernanceEconomicsService) {}

  /**
   * Checks if an expensive governance task (Replay, Fuzzing) is allowed.
   */
  isTaskAllowed(type: 'REPLAY' | 'FUZZ' | 'SNAPSHOT'): boolean {
    const report = this.economics.getEconomicsReport();
    
    // 1. Latency Protection
    if (report.avgArbitrationLatencyNs > 10_000_000) { // > 10ms
      this.logger.warn(`[Budget] Throttling ${type}: Kernel latency is exceeding sustainability budget.`);
      return false;
    }

    // 2. Task-specific quotas (simple logic for now)
    return true;
  }

  /**
   * Returns a budget-adjusted "Replay Fidelity" level.
   */
  getReplayFidelity(): 'L1' | 'L2' | 'L3' {
    const report = this.economics.getEconomicsReport();
    if (report.avgArbitrationLatencyNs > 5_000_000) return 'L1'; // Summary only
    if (report.avgArbitrationLatencyNs > 2_000_000) return 'L2'; // Incident only
    return 'L3'; // Full forensic
  }
}
