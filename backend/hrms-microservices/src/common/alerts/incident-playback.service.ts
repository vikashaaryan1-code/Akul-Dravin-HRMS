import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MitigationSignal } from './slo.types';

// ── Incident Event Types ──────────────────────────────────────────────────────

export type IncidentEventType =
  | 'SLO_BREACH'
  | 'SLO_RECOVERY'
  | 'DLQ_ENTRY'
  | 'PROJECTION_STALE'
  | 'MITIGATION_PROPOSED'
  | 'MITIGATION_EXECUTED'
  | 'MITIGATION_STABILIZING'
  | 'MITIGATION_RESOLVED'
  | 'MITIGATION_ROLLED_BACK'
  | 'DOMAIN_MUTATION';

export interface IncidentEvent {
  id:            string;
  type:          IncidentEventType;
  timestamp:     string;
  severity:      'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  source:        string;     // which layer produced this event
  description:   string;
  sloId?:        string;
  correlationId?: string;
  causationId?:   string;
  tenantId?:      string;
  /** IDs of events that causally preceded this one */
  causalChain:   string[];
  /** Raw payload for drill-down */
  metadata:      Record<string, unknown>;
}

export interface IncidentTimeline {
  windowStart:    string;
  windowEnd:      string;
  durationMinutes: number;
  events:         IncidentEvent[];
  summary: {
    sloBreaches:      number;
    dlqEntries:       number;
    projectionStales: number;
    mitigationsFired: number;
    domainMutations:  number;
  };
}

/**
 * INCIDENT PLAYBACK SERVICE — Phase AC
 *
 * Reconstructs a chronological, causally-linked incident timeline by merging
 * evidence from five data layers within a time window.
 *
 * ── Data sources merged ───────────────────────────────────────────────────────
 *  Layer 1 — slo_measurements:          SLO breach / recovery events
 *  Layer 2 — queue_dead_letters:        DLQ entries (failed jobs)
 *  Layer 3 — analytics_projection_vers: Projection staleness detections
 *  Layer 4 — audit_logs:               Domain mutations (hired, payroll, etc.)
 *  Layer 5 — MitigationSignal[]:        Lifecycle transitions (in-memory, passed in)
 *
 * ── Causal linking ────────────────────────────────────────────────────────────
 *  Events are linked causally when:
 *  - They share a correlationId (queue job → domain event → projection update)
 *  - A mitigation transition's causationId matches a breach event's id
 *  - A DLQ entry's job timestamp follows within 30s of a breach onset
 *
 * ── Value proposition ─────────────────────────────────────────────────────────
 *  Before: operators ask "what failed?"
 *  After:  operators reconstruct "what changed → why the platform behaved that way"
 *
 *  This is deterministic operational reconstruction — the foundation for:
 *   - Post-incident reviews with full evidence
 *   - Automated root cause suggestions
 *   - Mitigation effectiveness correlation
 *   - Regression detection across deploys
 */
@Injectable()
export class IncidentPlaybackService {
  private readonly logger = new Logger(IncidentPlaybackService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Public API ────────────────────────────────────────────────────────────

  async reconstruct(
    windowStart: Date,
    windowEnd:   Date,
    signals:     MitigationSignal[],
    tenantId?:   string,
  ): Promise<IncidentTimeline> {
    const [sloEvents, dlqEvents, projEvents, domainEvents, mitigationEvents] = await Promise.all([
      this.collectSloEvents(windowStart, windowEnd, tenantId),
      this.collectDlqEvents(windowStart, windowEnd),
      this.collectProjectionEvents(windowStart, windowEnd),
      this.collectDomainMutations(windowStart, windowEnd, tenantId),
      Promise.resolve(this.collectMitigationEvents(signals, windowStart, windowEnd)),
    ]);

    const allEvents = [
      ...sloEvents,
      ...dlqEvents,
      ...projEvents,
      ...domainEvents,
      ...mitigationEvents,
    ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // Link causal chains across events
    this.linkCausalChains(allEvents);

    const timeline: IncidentTimeline = {
      windowStart:     windowStart.toISOString(),
      windowEnd:       windowEnd.toISOString(),
      durationMinutes: Math.round((windowEnd.getTime() - windowStart.getTime()) / 60000),
      events:          allEvents,
      summary: {
        sloBreaches:      allEvents.filter(e => e.type === 'SLO_BREACH').length,
        dlqEntries:       allEvents.filter(e => e.type === 'DLQ_ENTRY').length,
        projectionStales: allEvents.filter(e => e.type === 'PROJECTION_STALE').length,
        mitigationsFired: allEvents.filter(e => e.type === 'MITIGATION_EXECUTED').length,
        domainMutations:  allEvents.filter(e => e.type === 'DOMAIN_MUTATION').length,
      },
    };

    this.logger.log(
      `[IncidentPlayback] Reconstructed ${allEvents.length} events over ${timeline.durationMinutes}m window`,
    );
    return timeline;
  }

  // ── Layer 1: SLO Breach / Recovery ───────────────────────────────────────

  private async collectSloEvents(start: Date, end: Date, tenantId?: string): Promise<IncidentEvent[]> {
    try {
      const rows = await this.ds.query<Array<{
        id: string; slo_id: string; measured_value: number;
        is_breach: boolean; deviation_pct: number; tenant_id: string | null; sampled_at: string;
      }>>(
        `SELECT id, slo_id, measured_value, is_breach, deviation_pct, tenant_id, sampled_at
         FROM slo_measurements
         WHERE sampled_at BETWEEN $1 AND $2
           ${tenantId ? 'AND (tenant_id = $3 OR tenant_id IS NULL)' : ''}
         ORDER BY sampled_at`,
        tenantId ? [start.toISOString(), end.toISOString(), tenantId] : [start.toISOString(), end.toISOString()],
      );

      return rows.map(r => ({
        id:          r.id,
        type:        r.is_breach ? 'SLO_BREACH' : 'SLO_RECOVERY' as IncidentEventType,
        timestamp:   r.sampled_at,
        severity:    r.is_breach ? (r.deviation_pct > 50 ? 'CRITICAL' : 'HIGH') : 'INFO' as any,
        source:      'slo_measurements',
        description: r.is_breach
          ? `SLO breach: ${r.slo_id} value=${r.measured_value} (${r.deviation_pct.toFixed(1)}% above threshold)`
          : `SLO recovery: ${r.slo_id} value=${r.measured_value} returned to passing`,
        sloId:       r.slo_id,
        tenantId:    r.tenant_id ?? undefined,
        causalChain: [],
        metadata:    { measured_value: r.measured_value, deviation_pct: r.deviation_pct, is_breach: r.is_breach },
      }));
    } catch (err) {
      this.logger.warn(`[IncidentPlayback] SLO events query failed: ${String(err)}`);
      return [];
    }
  }

  // ── Layer 2: DLQ Entries ──────────────────────────────────────────────────

  private async collectDlqEvents(start: Date, end: Date): Promise<IncidentEvent[]> {
    try {
      const rows = await this.ds.query<Array<{
        id: string; queue_name: string; job_name: string;
        correlation_id: string | null; causation_id: string | null;
        failed_at: string; error_message: string; retry_count: number;
      }>>(
        `SELECT id, queue_name, job_name, correlation_id, causation_id,
                failed_at, error_message, retry_count
         FROM queue_dead_letters
         WHERE failed_at BETWEEN $1 AND $2
         ORDER BY failed_at`,
        [start.toISOString(), end.toISOString()],
      );

      return rows.map(r => ({
        id:            r.id,
        type:          'DLQ_ENTRY' as IncidentEventType,
        timestamp:     r.failed_at,
        severity:      r.retry_count >= 3 ? 'HIGH' : 'MEDIUM' as any,
        source:        `queue:${r.queue_name}`,
        description:   `DLQ entry: ${r.job_name} on ${r.queue_name} failed after ${r.retry_count} retries — ${r.error_message.slice(0, 120)}`,
        correlationId: r.correlation_id ?? undefined,
        causationId:   r.causation_id  ?? undefined,
        causalChain:   [],
        metadata:      { queue_name: r.queue_name, job_name: r.job_name, retry_count: r.retry_count, error: r.error_message },
      }));
    } catch (err) {
      this.logger.warn(`[IncidentPlayback] DLQ events query failed: ${String(err)}`);
      return [];
    }
  }

  // ── Layer 3: Projection Staleness ─────────────────────────────────────────

  private async collectProjectionEvents(start: Date, end: Date): Promise<IncidentEvent[]> {
    try {
      const rows = await this.ds.query<Array<{
        id: string; domain: string; lag_seconds: number; version: number;
        is_stale: boolean; detected_at: string;
      }>>(
        `SELECT id, domain, lag_seconds, version, is_stale, detected_at
         FROM analytics_projection_versions
         WHERE detected_at BETWEEN $1 AND $2
           AND is_stale = TRUE
         ORDER BY detected_at`,
        [start.toISOString(), end.toISOString()],
      );

      return rows.map(r => ({
        id:          r.id,
        type:        'PROJECTION_STALE' as IncidentEventType,
        timestamp:   r.detected_at,
        severity:    r.lag_seconds > 300 ? 'HIGH' : 'MEDIUM' as any,
        source:      `projection:${r.domain}`,
        description: `Projection stale: ${r.domain} domain, lag=${r.lag_seconds}s, version=${r.version}`,
        causalChain: [],
        metadata:    { domain: r.domain, lag_seconds: r.lag_seconds, version: r.version },
      }));
    } catch (err) {
      this.logger.warn(`[IncidentPlayback] Projection events query failed: ${String(err)}`);
      return [];
    }
  }

  // ── Layer 4: Domain Mutations ─────────────────────────────────────────────

  private async collectDomainMutations(start: Date, end: Date, tenantId?: string): Promise<IncidentEvent[]> {
    try {
      const rows = await this.ds.query<Array<{
        id: string; aggregate_type: string; event_type: string;
        correlation_id: string | null; causation_id: string | null;
        tenant_id: string | null; occurred_at: string;
      }>>(
        `SELECT id, aggregate_type, event_type, correlation_id, causation_id, tenant_id, occurred_at
         FROM audit_logs
         WHERE occurred_at BETWEEN $1 AND $2
           ${tenantId ? 'AND tenant_id = $3' : ''}
         ORDER BY occurred_at
         LIMIT 200`,
        tenantId ? [start.toISOString(), end.toISOString(), tenantId] : [start.toISOString(), end.toISOString()],
      );

      return rows.map(r => ({
        id:            r.id,
        type:          'DOMAIN_MUTATION' as IncidentEventType,
        timestamp:     r.occurred_at,
        severity:      'INFO' as any,
        source:        `domain:${r.aggregate_type}`,
        description:   `${r.event_type} on ${r.aggregate_type}`,
        correlationId: r.correlation_id ?? undefined,
        causationId:   r.causation_id  ?? undefined,
        tenantId:      r.tenant_id     ?? undefined,
        causalChain:   [],
        metadata:      { aggregate_type: r.aggregate_type, event_type: r.event_type },
      }));
    } catch (err) {
      this.logger.warn(`[IncidentPlayback] Domain mutation query failed: ${String(err)}`);
      return [];
    }
  }

  // ── Layer 5: Mitigation Transitions ──────────────────────────────────────

  private collectMitigationEvents(signals: MitigationSignal[], start: Date, end: Date): IncidentEvent[] {
    const events: IncidentEvent[] = [];
    const typeMap: Partial<Record<string, IncidentEventType>> = {
      PROPOSED:     'MITIGATION_PROPOSED',
      EXECUTING:    'MITIGATION_EXECUTED',
      STABILIZING:  'MITIGATION_STABILIZING',
      RESOLVED:     'MITIGATION_RESOLVED',
      ROLLED_BACK:  'MITIGATION_ROLLED_BACK',
    };

    for (const sig of signals) {
      for (const t of sig.transitions) {
        if (t.from === t.to && t.to !== 'PROPOSED') continue; // skip no-op initial
        const ts = new Date(t.at);
        if (ts < start || ts > end) continue;

        const evtType = typeMap[t.to];
        if (!evtType) continue;

        events.push({
          id:          `${sig.id}:${t.to}:${t.at}`,
          type:        evtType,
          timestamp:   t.at,
          severity:    t.to === 'ROLLED_BACK' ? 'CRITICAL' : t.to === 'EXECUTING' ? 'HIGH' : 'INFO' as any,
          source:      'mitigation-engine',
          description: `Mitigation ${t.to}: ${sig.action} on ${sig.targetResource} (${t.actor})${t.reason ? ` — ${t.reason}` : ''}`,
          sloId:       sig.sloId,
          causalChain: [],
          metadata:    {
            signalId: sig.id, action: sig.action, targetResource: sig.targetResource,
            actor: t.actor, from: t.from, to: t.to,
          },
        });
      }
    }
    return events;
  }

  // ── Causal Chain Linking ──────────────────────────────────────────────────

  /**
   * Links events causally using three strategies:
   *  1. correlationId matching (queue jobs → domain events → projections)
   *  2. causationId pointing to a preceding event's id
   *  3. Temporal proximity: DLQ entry within 30s after SLO breach onset
   */
  private linkCausalChains(events: IncidentEvent[]): void {
    const byId          = new Map(events.map(e => [e.id, e]));
    const byCorrelation = new Map<string, IncidentEvent[]>();

    for (const e of events) {
      if (e.correlationId) {
        if (!byCorrelation.has(e.correlationId)) byCorrelation.set(e.correlationId, []);
        byCorrelation.get(e.correlationId)!.push(e);
      }
    }

    for (const e of events) {
      // Strategy 1: correlationId groups
      if (e.correlationId) {
        const peers = (byCorrelation.get(e.correlationId) ?? [])
          .filter(p => p.id !== e.id && p.timestamp < e.timestamp)
          .map(p => p.id);
        e.causalChain.push(...peers);
      }

      // Strategy 2: causationId → parent event
      if (e.causationId && byId.has(e.causationId)) {
        if (!e.causalChain.includes(e.causationId)) {
          e.causalChain.push(e.causationId);
        }
      }
    }

    // Strategy 3: temporal proximity — DLQ within 30s of SLO breach
    const breaches = events.filter(e => e.type === 'SLO_BREACH');
    const dlqItems = events.filter(e => e.type === 'DLQ_ENTRY');

    for (const dlq of dlqItems) {
      const dlqTime = new Date(dlq.timestamp).getTime();
      for (const breach of breaches) {
        const breachTime = new Date(breach.timestamp).getTime();
        if (dlqTime >= breachTime && dlqTime - breachTime <= 30_000) {
          if (!dlq.causalChain.includes(breach.id)) {
            dlq.causalChain.push(breach.id);
          }
        }
      }
    }
  }
}
