import { Injectable, Logger } from '@nestjs/common';
import { GovernanceHasherService } from './governance-hasher.service';

/**
 * TOOLCHAIN INTEGRITY SERVICE — Phase ∞-Terminal
 * 
 * Verifies that the coordination toolchain itself remains consistent. 
 * Prevents recursive drift in the replay, hashing, and arbitration logic.
 */
@Injectable()
export class ToolchainIntegrityService {
  private readonly logger = new Logger(ToolchainIntegrityService.name);

  constructor(private readonly hasher: GovernanceHasherService) {}

  /**
   * Verifies the integrity of the Governance Hasher itself.
   * Ensures that canonical serialization remains deterministic.
   */
  async verifyToolchainIntegrity(): Promise<boolean> {
    this.logger.log(`[Integrity] Initiating Toolchain Consistency Check...`);

    const testObject = { z: 1, a: 2, c: { b: 3 } };
    const expectedHash = this.hasher.hashState(testObject);
    
    // A second run must produce the exact same hash (Deterministic Baseline)
    const baselineHash = this.hasher.hashState({ a: 2, z: 1, c: { b: 3 } });

    if (expectedHash !== baselineHash) {
      this.logger.error(`[Integrity] FATAL: Toolchain has lost canonical determinism.`);
      return false;
    }

    this.logger.log(`[Integrity] SUCCESS: Toolchain remains semantic-consistent.`);
    return true;
  }
}
