import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ResourceReservationService } from './resource-reservation.service';

export type CoordinationEventType = 
  | 'SUPERSESSION' 
  | 'COOLDOWN_REJECTION' 
  | 'BREAKER_ACTIVATION' 
  | 'STARVATION_RECOVERY'
  | 'MAX_DEPTH_REJECTION'
  | 'CONSTITUTIONAL_REJECTION'
  | 'KERNEL_MODE_TRANSITION';

export interface CoordinationEvent {
  id:        string;
  timestamp: string;
  type:      CoordinationEventType;
  resourceKey?: string;
  ownerLabel?: string;
  metadata:  Record<string, any>;
  /**
   * Phase AV-Final: Feedback Isolation.
   * True if the event was triggered by a kernel stabilizer (rejection, breaker).
   * False if it was triggered by external contention (supersession, recovery).
   */
  isIntervention: boolean;
}

export interface StabilitySnapshot {
  timestamp:  string;
  entropy:    number;
  avgPressure: number;
  activeCount: number;
  waiterCount: number;
}

/**
 * COORDINATION DYNAMICS OBSERVATORY — Phase AV
 * 
 * Provides high-fidelity telemetry for the governance kernel's 
 * self-regulation dynamics (Entropy, Pressure, Starvation).
 */
@Injectable()
export class CoordinationTelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CoordinationTelemetryService.name);
  private readonly events: CoordinationEvent[] = [];
  private readonly snapshots: StabilitySnapshot[] = [];
  private readonly MAX_EVENTS = 1000;
  private readonly MAX_SNAPSHOTS = 1440; // 24 hours at 1min intervals
  private snapshotTimer: NodeJS.Timeout;

  constructor(
    @Inject(forwardRef(() => ResourceReservationService))
    private readonly reservation: ResourceReservationService,
  ) {}

  onModuleInit() {
    // Take a snapshot every 60 seconds
    this.snapshotTimer = setInterval(() => this.captureStabilityState(), 60_000);
  }

  onModuleDestroy() {
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
  }

  private captureStabilityState() {
    try {
      const report = this.reservation.getReport();
      const snapshots = report.activeReservations.map(r => r.coordinationPressure);
      const avgPressure = snapshots.length > 0 
        ? snapshots.reduce((a, b) => a + b, 0) / snapshots.length 
        : 0;

      this.takeSnapshot(
        report.stats.coordinationEntropy,
        Math.round(avgPressure * 100) / 100,
        report.stats.totalActive,
        report.stats.totalWaiting
      );
    } catch (err) {
      this.logger.error(`Snapshot capture failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  recordEvent(type: CoordinationEventType, resourceKey?: string, ownerLabel?: string, metadata: Record<string, any> = {}): void {
    const isIntervention = [
      'BREAKER_ACTIVATION', 
      'COOLDOWN_REJECTION', 
      'MAX_DEPTH_REJECTION'
    ].includes(type);

    const event: CoordinationEvent = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type,
      resourceKey,
      ownerLabel,
      metadata,
      isIntervention,
    };
    
    this.events.push(event);
    if (this.events.length > this.MAX_EVENTS) this.events.shift();
    
    if (type === 'BREAKER_ACTIVATION') {
      this.logger.error(`[Governance] CIRCUIT BREAKER ACTIVATED: ${JSON.stringify(metadata)}`);
    } else {
      this.logger.debug(`[Governance] Event: ${type} on ${resourceKey}`);
    }
  }

  takeSnapshot(entropy: number, avgPressure: number, activeCount: number, waiterCount: number): void {
    const snapshot: StabilitySnapshot = {
      timestamp: new Date().toISOString(),
      entropy,
      avgPressure,
      activeCount,
      waiterCount,
    };
    
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.MAX_SNAPSHOTS) this.snapshots.shift();
  }

  getHistory() {
    return {
      events: this.events,
      snapshots: this.snapshots,
      metrics: {
        totalEvents: this.events.length,
        lastEntropy: this.snapshots[this.snapshots.length - 1]?.entropy ?? 0,
        eventFrequency: this.calculateEventFrequency(),
      }
    };
  }

  private calculateEventFrequency(): Record<CoordinationEventType, number> {
    const counts: any = {};
    this.events.forEach(e => counts[e.type] = (counts[e.type] || 0) + 1);
    return counts;
  }
}
