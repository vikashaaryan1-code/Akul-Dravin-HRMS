import { Injectable, Logger } from '@nestjs/common';
import { GovernanceSnapshotService, GovernanceEpochSnapshot } from './governance-snapshot.service';
import { DeterministicReplaySandbox } from './deterministic-replay-sandbox.service';
import { AlgorithmManifest } from './governance-algorithm-registry';

/**
 * REPLAY EQUIVALENCE TESTER — Phase Ω
 * 
 * Automates the verification of "Semantic Consistency."
 * Verifies that replaying a historical state results in the 
 * exact same cryptographic hash, proving zero semantic drift.
 */
@Injectable()
export class ReplayEquivalenceTester {
  private readonly logger = new Logger(ReplayEquivalenceTester.name);

  constructor(
    private readonly snapshotService: GovernanceSnapshotService,
    private readonly sandbox:         DeterministicReplaySandbox,
  ) {}

  /**
   * Verifies that a historical snapshot is still deterministic.
   */
  async verifyEquivalence(
    snapshot: GovernanceEpochSnapshot, 
    currentManifest: AlgorithmManifest
  ): Promise<{ isValid: boolean; driftDetails?: string }> {
    
    this.logger.log(`[Verification] Starting Equivalence Test for Epoch ${snapshot.epochId}`);

    // 1. Verify Original Hash Integrity
    const isInternallyValid = this.snapshotService.verifyIntegrity(snapshot);
    if (!isInternallyValid) {
      return { isValid: false, driftDetails: 'Original snapshot hash is corrupted.' };
    }

    // 2. Perform Sandbox Replay
    const replayResult = this.sandbox.replayEpoch(snapshot, currentManifest);
    
    if (!replayResult) {
      return { isValid: false, driftDetails: 'Replay produced a different coordination outcome.' };
    }

    this.logger.log(`[Verification] SUCCESS: Epoch ${snapshot.epochId} remains semantic-consistent.`);
    return { isValid: true };
  }
}
