import { Injectable, Logger } from '@nestjs/common';

export enum RegulatorSignal {
  ENTROPY    = 'ENTROPY',
  STARVATION = 'STARVATION',
  ENERGY     = 'ENERGY',
  THROUGHPUT = 'THROUGHPUT',
}

/**
 * REGULATOR INTERACTION SERVICE — Phase ∞-Terminal
 * 
 * Provides a dynamic model for coordination regulators.
 * Detects interactions and stability risks between regulators.
 */
@Injectable()
export class RegulatorInteractionService {
  private readonly logger = new Logger(RegulatorInteractionService.name);

  // Influence Matrix: Source Signal -> Target Signal -> Gain (-1 to 1)
  private readonly influenceMatrix: Record<RegulatorSignal, Partial<Record<RegulatorSignal, number>>> = {
    [RegulatorSignal.ENTROPY]: {
      [RegulatorSignal.THROUGHPUT]: -0.5, // Entropy damping reduces throughput
      [RegulatorSignal.ENERGY]:     -0.2, // Entropy consumes energy
    },
    [RegulatorSignal.STARVATION]: {
      [RegulatorSignal.THROUGHPUT]: -0.3, // Starvation fairness reduces raw throughput
      [RegulatorSignal.ENTROPY]:     0.1, // Starvation boosts can increase churn/entropy
    },
    [RegulatorSignal.ENERGY]: {
      [RegulatorSignal.THROUGHPUT]:  1.0, // Energy budget enables throughput
    },
    [RegulatorSignal.THROUGHPUT]: {
      [RegulatorSignal.ENTROPY]:     0.2, // High throughput naturally raises entropy
    }
  };

  /**
   * Analyzes a proposed regulator configuration for interaction risks.
   */
  analyzeStability(regulatorGains: Record<RegulatorSignal, number>): { isStable: boolean; riskScore: number; interactionDetected?: string } {
    this.logger.log(`[Dynamics] Analyzing regulator interactions...`);
    
    // Simple Loop Detection (Entropy -> Throughput -> Entropy)
    const entropyToThroughput = this.influenceMatrix[RegulatorSignal.ENTROPY][RegulatorSignal.THROUGHPUT] ?? 0;
    const throughputToEntropy = this.influenceMatrix[RegulatorSignal.THROUGHPUT][RegulatorSignal.ENTROPY] ?? 0;

    if (entropyToThroughput * throughputToEntropy > 0.5) {
      return { isStable: false, riskScore: 0.9, interactionDetected: 'ENTROPY_THROUGHPUT_OSCILLATION' };
    }

    return { isStable: true, riskScore: 0.2 };
  }

  getInfluenceMatrix() {
    return this.influenceMatrix;
  }
}
