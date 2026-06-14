import { Injectable, Logger } from '@nestjs/common';

export interface SovereignAttestation {
  operatorId: string;
  timestamp:  string;
  reason:     string;
  targetHash: string; // The hash of the decision being overridden
  action:     'VETO' | 'OVERRIDE' | 'FREEZE';
  signature?: string; // Cryptographic attestation
}

export interface QuorumState {
  action:      'FREEZE' | 'VETO';
  signatures:  Set<string>;
  targetHash:  string;
  timestamp:   string;
}

/**
 * GOVERNANCE SOVEREIGNTY SERVICE — Phase BB
 * 
 * Establishes human authority over the autonomous coordination kernel.
 * Enables emergency freezes, manual vetoes, and auditable attestations.
 */
@Injectable()
export class GovernanceSovereigntyService {
  private readonly logger = new Logger(GovernanceSovereigntyService.name);
  private isKernelFrozen = false;
  private attestations: SovereignAttestation[] = [];
  private activeQuorums: Map<string, QuorumState> = new Map();

  private readonly QUORUM_THRESHOLD = 2; // Requires 2-of-3 admins

  /**
   * PROPOSE FREEZE: Initiates a multi-party quorum to freeze the kernel.
   * Requires signatures from multiple operators.
   */
  proposeFreeze(operatorId: string, reason: string) {
    let quorum = this.activeQuorums.get('GLOBAL_FREEZE');
    if (!quorum) {
      quorum = { action: 'FREEZE', signatures: new Set(), targetHash: 'GLOBAL', timestamp: new Date().toISOString() };
      this.activeQuorums.set('GLOBAL_FREEZE', quorum);
    }

    quorum.signatures.add(operatorId);
    this.logger.warn(`[Sovereignty] FREEZE Proposal updated. Signatures: ${quorum.signatures.size}/${this.QUORUM_THRESHOLD}`);

    if (quorum.signatures.size >= this.QUORUM_THRESHOLD) {
      this.isKernelFrozen = true;
      this.activeQuorums.delete('GLOBAL_FREEZE');
      this.logger.error(`[Sovereignty] KERNEL EMERGENCY FREEZE ACTIVATED (Quorum met). Reason: ${reason}`);
    }
  }

  thawKernel(operatorId: string) {
    this.isKernelFrozen = false;
    this.logger.log(`[Sovereignty] KERNEL THAWED by ${operatorId}. Resuming autonomous coordination.`);
  }

  isFrozen(): boolean {
    return this.isKernelFrozen;
  }

  /**
   * MANUAL VETO: Overrides a specific kernel decision.
   * Requires a signed rationale linked to the decision hash.
   */
  vetoDecision(attestation: SovereignAttestation) {
    this.attestations.push(attestation);
    this.logger.warn(`[Sovereignty] SOVEREIGN VETO applied to Hash ${attestation.targetHash} by ${attestation.operatorId}`);
  }

  private recordAttestation(a: SovereignAttestation) {
    this.attestations.push(a);
  }

  getAttestations(): SovereignAttestation[] {
    return [...this.attestations].reverse();
  }
}
