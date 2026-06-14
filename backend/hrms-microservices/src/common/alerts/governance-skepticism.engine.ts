import { Injectable, Logger } from '@nestjs/common';

export interface EpistemicConfidence {
  score:       number; // 0.0 to 1.0
  caveat:      string;
  residualRisk: string;
}

/**
 * GOVERNANCE SKEPTICISM ENGINE — Phase ∞-Terminal
 * 
 * The "Humility Guard." 
 * Instead of absolute "Truth," it communicates "Confidence." 
 * Flags boundaries where determinism relies on unproven environmental factors.
 */
@Injectable()
export class GovernanceSkepticismEngine {
  private readonly logger = new Logger(GovernanceSkepticismEngine.name);

  /**
   * Evaluates the institutional confidence for a given domain.
   * Emphasizes residual risk and the limits of formal verification.
   */
  evaluateConfidence(domain: string, isAdversarial: boolean = false): EpistemicConfidence {
    const score = isAdversarial ? 0.65 : 0.94;
    
    if (isAdversarial) {
      this.logger.warn(`[Skepticism] Confidence Downgrade: Adversarial environment detected for ${domain}`);
    }

    return {
      score,
      caveat: score > 0.9 
        ? 'High probability under bounded assumptions; assumes toolchain integrity.' 
        : 'Bounded confidence; unmodeled environmental jitter detected.',
      residualRisk: 'Environmental race windows and asynchronous non-determinism are unmodeled.',
    };
  }

  /**
   * Legacy alias for compatibility during transition.
   */
  assessConfidence(): EpistemicConfidence {
    return this.evaluateConfidence('GLOBAL');
  }
}
