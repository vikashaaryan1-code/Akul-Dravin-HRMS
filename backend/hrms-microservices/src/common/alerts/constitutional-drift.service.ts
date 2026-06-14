import { Injectable, Logger } from '@nestjs/common';
import { CoordinationTelemetryService } from './coordination-telemetry.service';
import { ConstitutionalRegistryService } from './constitutional-registry.service';

export interface DriftReport {
  timestamp: string;
  divergenceScore: number; // 0-1
  findings: string[];
  recommendation?: string;
}

/**
 * CONSTITUTIONAL DRIFT SERVICE — Phase AY
 * 
 * Monitors the subtle divergence between constitutional semantics 
 * and actual operational outcomes (e.g. fairness technical compliance 
 * vs latent starvation).
 */
@Injectable()
export class ConstitutionalDriftService {
  private readonly logger = new Logger(ConstitutionalDriftService.name);

  constructor(
    private readonly telemetry: CoordinationTelemetryService,
    private readonly registry:  ConstitutionalRegistryService,
  ) {}

  analyzeDrift(): DriftReport {
    const history = this.telemetry.getHistory();
    const config = this.registry.getEffectiveConfig();
    
    const findings: string[] = [];
    let divergence = 0;

    const recoveryEvents = history.events.filter(e => e.type === 'STARVATION_RECOVERY');
    const avgWaitMs = recoveryEvents.length > 0
      ? recoveryEvents.reduce((s, e) => s + (e.metadata?.waitMs || 0), 0) / recoveryEvents.length
      : 0;
    
    if (avgWaitMs > 300_000 && (history.metrics.eventFrequency['CONSTITUTIONAL_REJECTION'] || 0) === 0) {
      findings.push('LATENT_STARVATION: High wait times despite zero constitutional rejections.');
      divergence += 0.3;
    }

    // 2. Check for "Regulator Over-Dominance"
    // Is conservation mode being triggered too close to the constitutional limit frequently?
    const conservationEvents = history.events.filter(e => e.type === 'KERNEL_MODE_TRANSITION' && e.metadata?.mode === 'CONSERVATION');
    if (conservationEvents.length > 5) {
      findings.push('REGULATOR_FATIGUE: Frequent transitions into conservation mode suggest constitutional thresholds may be too high.');
      divergence += 0.2;
    }

    return {
      timestamp: new Date().toISOString(),
      divergenceScore: Math.min(1.0, divergence),
      findings,
      recommendation: divergence > 0.4 ? 'Consider Constitutional Version Evolution (AX-AY transition).' : undefined,
    };
  }
}
