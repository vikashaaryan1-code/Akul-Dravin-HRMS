import { Injectable, Logger } from '@nestjs/common';

export interface GovernanceEconomicsReport {
  timestamp: string;
  avgArbitrationLatencyNs: number;
  totalHashingTimeMs:      number;
  telemetryStorageBytes:   number;
  snapshotAmplification:   number; // Bytes per reservation
  isWithinBudget:          boolean;
}

/**
 * GOVERNANCE ECONOMICS SERVICE — Phase Σ
 * 
 * Measures the "Thermodynamic Cost" of the governance kernel.
 * Ensures that the coordination layer does not destabilize the system 
 * through excessive computational or storage overhead.
 */
@Injectable()
export class GovernanceEconomicsService {
  private readonly logger = new Logger(GovernanceEconomicsService.name);
  private metrics = {
    arbitrationLatencies: [] as number[],
    hashingTimes:         0,
    storageUsage:         0,
    epochCount:           0,
  };

  recordArbitration(latencyNs: number) {
    this.metrics.arbitrationLatencies.push(latencyNs);
    if (this.metrics.arbitrationLatencies.length > 1000) this.metrics.arbitrationLatencies.shift();
  }

  recordHashing(timeMs: number) {
    this.metrics.hashingTimes += timeMs;
    this.metrics.epochCount++;
  }

  getEconomicsReport(): GovernanceEconomicsReport {
    const avgLat = this.metrics.arbitrationLatencies.reduce((a, b) => a + b, 0) / 
                   (this.metrics.arbitrationLatencies.length || 1);
    
    return {
      timestamp: new Date().toISOString(),
      avgArbitrationLatencyNs: Math.round(avgLat),
      totalHashingTimeMs:      Math.round(this.metrics.hashingTimes),
      telemetryStorageBytes:   this.metrics.storageUsage,
      snapshotAmplification:   this.metrics.epochCount > 0 ? Math.round(this.metrics.storageUsage / this.metrics.epochCount) : 0,
      isWithinBudget:          avgLat < 5_000_000, // Budget: < 5ms avg arbitration
    };
  }
}
