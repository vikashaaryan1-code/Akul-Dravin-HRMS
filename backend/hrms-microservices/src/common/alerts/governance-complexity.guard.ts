import { Injectable, Logger } from '@nestjs/common';

/**
 * GOVERNANCE COMPLEXITY GUARD — Phase ∞
 * 
 * Enforces the "Complexity Budget" for the coordination kernel.
 * Prevents the system from reaching "Institutional Fragility" 
 * by capping the number of active invariants and regulators.
 */
@Injectable()
export class GovernanceComplexityGuard {
  private readonly logger = new Logger(GovernanceComplexityGuard.name);

  // The immutable complexity ceilings
  private readonly BUDGETS = {
    MAX_CONSTITUTIONAL_INVARIANTS: 10,
    MAX_ACTIVE_REGULATORS:         5,
    MAX_LINEAGE_DEPTH:             7,
    MAX_TENANT_OVERLAYS:           20,
  };

  /**
   * Verifies if a new constitutional version fits within the complexity budget.
   */
  validateComplexity(invariantCount: number, regulatorCount: number) {
    if (invariantCount > this.BUDGETS.MAX_CONSTITUTIONAL_INVARIANTS) {
      this.logger.error(`[Complexity] REJECTED: Too many invariants (${invariantCount}). Ceiling: ${this.BUDGETS.MAX_CONSTITUTIONAL_INVARIANTS}`);
      return false;
    }

    if (regulatorCount > this.BUDGETS.MAX_ACTIVE_REGULATORS) {
      this.logger.error(`[Complexity] REJECTED: Too many regulators (${regulatorCount}). Ceiling: ${this.BUDGETS.MAX_ACTIVE_REGULATORS}`);
      return false;
    }

    return true;
  }

  getBudgets() {
    return { ...this.BUDGETS };
  }
}
