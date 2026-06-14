import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AlertRecord, SloId, SloSeverity } from './slo.types';

/**
 * ALERT HISTORY SERVICE
 *
 * In-memory circular ring buffer for alert records.
 * Surfaced to PlatformOpsView via AdminController.
 *
 * ── Design ────────────────────────────────────────────────────────────────────
 *  - Bounded at 200 entries (configurable). Oldest entries evicted first.
 *  - No persistence — this is fast-read operational history, not audit log.
 *    Audit-grade persistence lives in entity_revision_log + queue_dead_letters.
 *  - Thread-safe for single Node.js process (no concurrent mutation issues).
 *  - Supports resolution tracking: when an SLO returns to passing state,
 *    `resolve()` marks the corresponding FIRED record as RESOLVED.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *   // In SloService:
 *   this.alertHistory.record({ sloId: 'dlq-spike', severity: SloSeverity.HIGH, ... });
 *
 *   // In AdminController (frontend):
 *   return this.alertHistory.getHistory(50);
 */
@Injectable()
export class AlertHistoryService {
  private readonly MAX_SIZE = 200;
  private readonly buffer: AlertRecord[] = [];

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Records a new alert. If buffer is full, evicts the oldest entry.
   * Returns the generated AlertRecord.
   */
  record(input: Omit<AlertRecord, 'id'>): AlertRecord {
    const record: AlertRecord = { id: randomUUID(), ...input };

    if (this.buffer.length >= this.MAX_SIZE) {
      this.buffer.shift(); // Evict oldest
    }
    this.buffer.push(record);
    return record;
  }

  /**
   * Marks the most recent FIRED alert for a given SLO as RESOLVED.
   * Called when SloService detects the SLO has returned to passing state.
   */
  resolve(sloId: SloId): AlertRecord | null {
    // Find the latest FIRED (non-resolved) alert for this SLO
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      if (this.buffer[i].sloId === sloId && this.buffer[i].status === 'FIRED') {
        this.buffer[i] = {
          ...this.buffer[i],
          status: 'RESOLVED',
          resolvedAt: new Date().toISOString(),
        };
        return this.buffer[i];
      }
    }
    return null;
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /** Returns the last N alerts, newest first */
  getHistory(limit = 50): AlertRecord[] {
    return [...this.buffer].reverse().slice(0, limit);
  }

  /** Returns only FIRED (unresolved) alerts, newest first */
  getActive(): AlertRecord[] {
    return this.buffer.filter(a => a.status === 'FIRED').reverse();
  }

  /** Returns alerts filtered by severity */
  getBySeverity(severity: SloSeverity): AlertRecord[] {
    return this.buffer.filter(a => a.severity === severity).reverse();
  }

  /** Returns alerts for a specific SLO */
  getBySlo(sloId: SloId): AlertRecord[] {
    return this.buffer.filter(a => a.sloId === sloId).reverse();
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  /**
   * Computes breach statistics for the SLO dashboard analytics panel.
   */
  getBreachStats(): {
    totalFired: number;
    totalResolved: number;
    totalActive: number;
    bySeverity: Record<string, number>;
    bySlo: Record<string, number>;
    avgMttrSeconds: number | null;
  } {
    const fired    = this.buffer.filter(a => a.status !== 'SUPPRESSED');
    const resolved = fired.filter(a => a.status === 'RESOLVED');
    const active   = fired.filter(a => a.status === 'FIRED');

    const bySeverity: Record<string, number> = {};
    const bySlo: Record<string, number> = {};
    for (const a of fired) {
      bySeverity[a.severity] = (bySeverity[a.severity] ?? 0) + 1;
      bySlo[a.sloId]         = (bySlo[a.sloId] ?? 0) + 1;
    }

    // Mean time to resolve (seconds)
    const resolvedWithTimes = resolved.filter(a => a.resolvedAt);
    const avgMttrSeconds = resolvedWithTimes.length > 0
      ? Math.round(
          resolvedWithTimes.reduce((sum, a) =>
            sum + (new Date(a.resolvedAt!).getTime() - new Date(a.firedAt).getTime()) / 1000, 0
          ) / resolvedWithTimes.length
        )
      : null;

    return { totalFired: fired.length, totalResolved: resolved.length, totalActive: active.length, bySeverity, bySlo, avgMttrSeconds };
  }

  // ── Maintenance ───────────────────────────────────────────────────────────

  clearResolved(): number {
    const before = this.buffer.length;
    const keep = this.buffer.filter(a => a.status !== 'RESOLVED');
    this.buffer.length = 0;
    this.buffer.push(...keep);
    return before - this.buffer.length;
  }

  size(): number {
    return this.buffer.length;
  }
}
