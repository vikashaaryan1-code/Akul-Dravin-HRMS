import { Injectable, Logger } from '@nestjs/common';
import { KernelMode } from './resource-reservation.types';
import { ConstitutionalRegistryService } from './constitutional-registry.service';

export interface ConstitutionalCheck {
  isAllowed: boolean;
  reason?: string;
  invariant: string;
}

/**
 * GOVERNANCE CONSTITUTION SERVICE — Phase AX
 * 
 * Defines the non-negotiable operational invariants of the kernel.
 * These rules override any adaptive regulator or mode to preserve 
 * systemic liveness and safety.
 */
@Injectable()
export class GovernanceConstitutionService {
  private readonly logger = new Logger(GovernanceConstitutionService.name);

  constructor(private readonly registry: ConstitutionalRegistryService) {}

  /**
   * Final constitutional check before a reservation is admitted or rejected.
   */
  verify(
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM',
    mode: KernelMode,
    modeStartTime: string,
    energyUsagePercent: number,
    consecutiveRejections: number,
  ): ConstitutionalCheck {
    const config = this.registry.getEffectiveConfig();
    
    // Invariant 1: CRITICAL_LIVENESS_GUARANTEE
    // Critical work must NEVER be rejected indefinitely.
    if (urgency === 'CRITICAL' && consecutiveRejections >= config.criticalLivenessMaxRejections) {
      return { 
        isAllowed: true, 
        invariant: 'CRITICAL_LIVENESS_GUARANTEE',
        reason: `Override: Constitutional guarantee for critical recovery liveness (max ${config.criticalLivenessMaxRejections} rejections).` 
      };
    }

    // Invariant 2: MAX_CONSERVATION_TENURE
    // Conservation mode cannot persist indefinitely (max duration from config).
    const modeDuration = Date.now() - new Date(modeStartTime).getTime();
    if (mode === KernelMode.CONSERVATION && modeDuration > config.maxConservationTenureMs) {
      return {
        isAllowed: true,
        invariant: 'MAX_CONSERVATION_TENURE',
        reason: `Override: Maximum conservation tenure (${config.maxConservationTenureMs}ms) exceeded.`
      };
    }

    // Invariant 3: ENERGY_RESERVE_CAP
    // Always preserve energy for CRITICAL recovery.
    const energyLimit = 1.0 - config.energyReservePercent;
    if (urgency !== 'CRITICAL' && energyUsagePercent > energyLimit) {
      return {
        isAllowed: false,
        invariant: 'ENERGY_RESERVE_CAP',
        reason: `Rejected: Energy budget restricted to CRITICAL recovery lineages (>${energyLimit * 100}% usage).`
      };
    }

    return { isAllowed: true, invariant: 'DEFAULT_CONSTITUTION' };
  }
}
