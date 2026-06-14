import { Injectable, Logger } from '@nestjs/common';
import { CoordinationTelemetryService } from './coordination-telemetry.service';
import { KernelMode } from './resource-reservation.types';

/**
 * STABILITY ENVELOPE SERVICE — Phase AW
 * 
 * Maps the kernel's coordination thermodynamics to detect oscillation risk 
 * and define the current operational stability envelope.
 */
@Injectable()
export class StabilityEnvelopeService {
  private readonly logger = new Logger(StabilityEnvelopeService.name);

  constructor(private readonly telemetry: CoordinationTelemetryService) {}

  /**
   * Calculates the 0-1 risk score for coordination oscillation.
   * Based on entropy levels, acceleration, and recent churn frequency.
   */
  calculateOscillationRisk(): number {
    const history = this.telemetry.getHistory();
    const snapshots = history.snapshots;
    if (snapshots.length < 2) return 0;

    const current = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];

    // 1. Static Entropy Risk (40%)
    const staticRisk = current.entropy * 0.4;

    // 2. Entropy Acceleration (30%)
    // If entropy is rising, risk increases significantly.
    const entropyDelta = current.entropy - previous.entropy;
    const accelerationRisk = entropyDelta > 0 ? Math.min(0.3, entropyDelta * 10) : 0;

    // 3. Churn Intensity (30%)
    // Supersessions per snapshot window.
    const recentEvents = history.events.filter(e => {
      const age = Date.now() - new Date(e.timestamp).getTime();
      return age < 300_000; // Last 5 mins
    });
    const churnCount = recentEvents.filter(e => e.type === 'SUPERSESSION').length;
    const churnRisk = Math.min(0.3, (churnCount / 10) * 0.3);

    return Math.round((staticRisk + accelerationRisk + churnRisk) * 100) / 100;
  }

  /**
   * Recommends the optimal KernelMode based on the stability envelope.
   */
  recommendMode(entropy: number, risk: number): KernelMode {
    if (entropy > 0.9 || risk > 0.9) return KernelMode.CONSERVATION;
    if (entropy > 0.8 || risk > 0.75) return KernelMode.RECOVERY;
    if (entropy > 0.6 || risk > 0.5)  return KernelMode.STABILITY;
    return KernelMode.THROUGHPUT;
  }
}
