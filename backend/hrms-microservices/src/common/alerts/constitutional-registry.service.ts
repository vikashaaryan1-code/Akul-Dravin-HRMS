import { Injectable, Logger } from '@nestjs/common';

export interface InvariantConfig {
  criticalLivenessMaxRejections: number;
  maxConservationTenureMs:      number;
  energyReservePercent:         number;
  displacementFrictionScale:    number;
}

export interface ConstitutionVersion {
  version:    number;
  author:     string;
  deployedAt: string;
  rationale:  string;
  config:     InvariantConfig;
  isCertified: boolean;
}

/**
 * CONSTITUTIONAL REGISTRY SERVICE — Phase AY
 * 
 * Manages the evolution of the kernel's operational constitution.
 * Ensures that changes to foundational laws are versioned, 
 * simulated, and certified.
 */
@Injectable()
export class ConstitutionalRegistryService {
  private readonly logger = new Logger(ConstitutionalRegistryService.name);
  private versions: ConstitutionVersion[] = [];
  private activeVersionIndex = 0;

  constructor() {
    // Version 1.0 (The Initial Constitution)
    this.versions.push({
      version: 1.0,
      author: 'Antigravity:Arch',
      deployedAt: new Date().toISOString(),
      rationale: 'Initial operational invariants for thermodynamic coordination stabilization.',
      isCertified: true,
      config: {
        criticalLivenessMaxRejections: 2,
        maxConservationTenureMs:      300_000, // 5 mins
        energyReservePercent:         0.15,    // 15% for recovery
        displacementFrictionScale:    2.0,     // Stability mode friction
      },
    });
  }

  getEffectiveConfig(): InvariantConfig {
    return this.versions[this.activeVersionIndex].config;
  }

  getHistory(): ConstitutionVersion[] {
    return [...this.versions].reverse();
  }

  /**
   * Proposes a new constitutional version. 
   * Requires certification (simulation) before it can be activated.
   */
  proposeVersion(config: InvariantConfig, author: string, rationale: string): number {
    const nextVersion = Math.round((this.versions[this.versions.length - 1].version + 0.1) * 10) / 10;
    
    this.versions.push({
      version: nextVersion,
      author,
      deployedAt: new Date().toISOString(),
      rationale,
      config,
      isCertified: false,
    });

    this.logger.log(`[Governance] Proposed Constitutional Version ${nextVersion} by ${author}`);
    return nextVersion;
  }

  certifyVersion(version: number) {
    const v = this.versions.find(v => v.version === version);
    if (v) {
      v.isCertified = true;
      this.logger.log(`[Governance] Constitutional Version ${version} CERTIFIED via simulation.`);
    }
  }

  activateVersion(version: number) {
    const index = this.versions.findIndex(v => v.version === version);
    if (index === -1) throw new Error('Version not found');
    if (!this.versions[index].isCertified) throw new Error('Cannot activate uncertified constitution');

    this.activeVersionIndex = index;
    this.logger.warn(`[Governance] KERNEL CONSTITUTION EVOLVED to Version ${version}`);
  }
}
