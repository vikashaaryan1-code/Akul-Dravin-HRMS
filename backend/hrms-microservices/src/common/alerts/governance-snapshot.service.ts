import { Injectable, Logger } from '@nestjs/common';
import { GovernanceHasherService } from './governance-hasher.service';
import { KernelMode } from './resource-reservation.types';
import { AlgorithmManifest, CURRENT_GOVERNANCE_MANIFEST } from './governance-algorithm-registry';

export interface GovernanceEpochSnapshot {
  epochId:   string;
  timestamp: string;
  constitutionVersion: number;
  algorithmManifest:   AlgorithmManifest; // Phase BA
  kernelMode:  KernelMode;
  entropy:     number;
  energyUsage: number;
  topologyHash: string;
  governanceHash?: string;
}

/**
 * GOVERNANCE SNAPSHOT SERVICE — Phase AZ
 * 
 * Captures forensic-grade snapshots of the kernel's governance state.
 * Enables deterministic replay and legal-grade auditability.
 */
@Injectable()
export class GovernanceSnapshotService {
  private readonly logger = new Logger(GovernanceSnapshotService.name);

  constructor(private readonly hasher: GovernanceHasherService) {}

  /**
   * Captures the full state of a governance epoch.
   */
  captureEpoch(
    constitutionVersion: number,
    mode: KernelMode,
    entropy: number,
    energyUsage: number,
    activeReservationKeys: string[],
  ): GovernanceEpochSnapshot {
    
    // 1. Topology Hash (who owns what)
    const topologyHash = this.hasher.hashState({ keys: activeReservationKeys.sort() });

    const snapshot: GovernanceEpochSnapshot = {
      epochId: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      constitutionVersion,
      algorithmManifest: CURRENT_GOVERNANCE_MANIFEST,
      kernelMode: mode,
      entropy: Math.round(entropy * 1000) / 1000,
      energyUsage: Math.round(energyUsage * 1000) / 1000,
      topologyHash,
    };

    // 2. Total Governance Hash
    snapshot.governanceHash = this.hasher.hashState(snapshot);

    this.logger.debug(`[Governance] Epoch Snapshot Captured: ${snapshot.epochId} (Hash: ${snapshot.governanceHash.substring(0, 8)})`);
    return snapshot;
  }

  verifyIntegrity(snapshot: GovernanceEpochSnapshot): boolean {
    const { governanceHash, ...data } = snapshot;
    const computed = this.hasher.hashState(data);
    return computed === governanceHash;
  }
}
