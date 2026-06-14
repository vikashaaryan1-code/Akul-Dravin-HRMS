import { Injectable } from '@nestjs/common';
import { KernelMode } from './resource-reservation.types';

export interface GovernanceReasoning {
  decision:   'GRANTED' | 'REJECTED' | 'SUPERSEDED' | 'CONSTITUTIONAL_OVERRIDE';
  mode:       KernelMode;
  rationale:  string;
  stabilityFactors: {
    entropy: number;
    risk:    number;
    energy:  number;
  };
  recommendation?: string;
}

/**
 * REGULATOR EXPLAINABILITY ENGINE — Phase AX
 * 
 * Translates complex coordination thermodynamics and adaptive modes 
 * into human-comprehensible operational narratives.
 */
@Injectable()
export class RegulatorExplainabilityService {

  generateReasoning(
    decision: 'GRANTED' | 'REJECTED' | 'SUPERSEDED' | 'CONSTITUTIONAL_OVERRIDE',
    mode: KernelMode,
    entropy: number,
    risk: number,
    energyUsage: number,
    additionalContext?: string
  ): GovernanceReasoning {
    
    let rationale = '';

    if (decision === 'CONSTITUTIONAL_OVERRIDE') {
      rationale = `Adaptive mode ${mode} was overridden by a Constitutional Invariant. ${additionalContext}`;
    } else if (mode === KernelMode.CONSERVATION) {
      rationale = 'Kernel is in CONSERVATION mode to prevent systemic collapse. Entropy acceleration is non-linear.';
    } else if (mode === KernelMode.RECOVERY) {
      rationale = 'Kernel is prioritizing CRITICAL recovery lineages to stabilize topology.';
    } else if (mode === KernelMode.STABILITY) {
      rationale = 'High coordination entropy detected. Damping friction has been scaled to reduce churn.';
    } else {
      rationale = 'Normal operational state. Admissions based on utility-delta arbitration.';
    }

    const rec = this.getRecommendation(mode, risk);

    return {
      decision,
      mode,
      rationale,
      stabilityFactors: {
        entropy: Math.round(entropy * 100) / 100,
        risk:    Math.round(risk * 100) / 100,
        energy:  Math.round(energyUsage * 100) / 100,
      },
      recommendation: rec,
    };
  }

  private getRecommendation(mode: KernelMode, risk: number): string | undefined {
    if (mode === KernelMode.CONSERVATION) return 'Retry in 60s. Reduce reservation tenure if possible.';
    if (mode === KernelMode.RECOVERY)     return 'Only CRITICAL urgency work is being admitted. Delay non-essential mitigations.';
    if (risk > 0.7)                      return 'Oscillation risk is high. Avoid deep reservation lineages.';
    return undefined;
  }
}
