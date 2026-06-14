import { Injectable } from '@nestjs/common';

/**
 * GOVERNANCE AUTHORITY TIERS
 * 
 * Defines the canonical hierarchy of operational authority.
 */
export enum AuthorityTier {
  SOVEREIGN      = 4, // Final human override (Veto/Freeze)
  CONSTITUTIONAL = 3, // Operational Laws (Invariants)
  ADAPTIVE       = 2, // Stability Regulators (Kernel Modes)
  POLICY         = 1, // Application Workflow Intent
  DEFAULT        = 0,
}

/**
 * GOVERNANCE PRECEDENCE REGISTRY — Phase Ω
 * 
 * Codifies the immutable hierarchy of operational logic. 
 * Prevents governance forking by ensuring that higher-tier authority 
 * ALWAYS overrides lower-tier decisions.
 */
@Injectable()
export class GovernancePrecedenceRegistry {

  /**
   * Evaluates which of two conflicting authorities should prevail.
   */
  resolveConflict(tierA: AuthorityTier, tierB: AuthorityTier): AuthorityTier {
    return tierA >= tierB ? tierA : tierB;
  }

  /**
   * Returns the canonical hierarchy for audit/explanation purposes.
   */
  getHierarchy(): { tier: AuthorityTier; label: string }[] {
    return [
      { tier: AuthorityTier.SOVEREIGN,      label: 'Human Sovereignty (Override/Freeze)' },
      { tier: AuthorityTier.CONSTITUTIONAL, label: 'Constitutional Invariants (Operational Law)' },
      { tier: AuthorityTier.ADAPTIVE,       label: 'Adaptive Stabilization (Regulator Modes)' },
      { tier: AuthorityTier.POLICY,         label: 'Application Policy (Workflow Intent)' },
    ];
  }
}
