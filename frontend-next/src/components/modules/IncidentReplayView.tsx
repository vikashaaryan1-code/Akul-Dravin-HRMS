'use client';
import { useState } from 'react';
import {
  AlertTriangle, CheckCircle, Zap, Inbox, Database,
  Shield, Activity, Link, ChevronRight, Clock, Layers,
  GitBranch, RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type IncidentEventType =
  | 'SLO_BREACH' | 'SLO_RECOVERY' | 'DLQ_ENTRY' | 'PROJECTION_STALE'
  | 'MITIGATION_PROPOSED' | 'MITIGATION_EXECUTED' | 'MITIGATION_STABILIZING'
  | 'MITIGATION_RESOLVED' | 'MITIGATION_ROLLED_BACK' | 'DOMAIN_MUTATION';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

interface IncidentEvent {
  id: string; type: IncidentEventType; timestamp: string; severity: Severity;
  source: string; description: string; sloId?: string; correlationId?: string;
  causationId?: string; tenantId?: string; causalChain: string[];
  metadata: Record<string, unknown>;
}

interface IncidentTimeline {
  windowStart: string; windowEnd: string; durationMinutes: number;
  events: IncidentEvent[];
  summary: { sloBreaches: number; dlqEntries: number; projectionStales: number; mitigationsFired: number; domainMutations: number };
}

// ── Demo Data ─────────────────────────────────────────────────────────────────

const now = Date.now();
const ts = (offsetMin: number) => new Date(now - (60 - offsetMin) * 60000).toISOString();

const DEMO_TIMELINE: IncidentTimeline = {
  windowStart: new Date(now - 60 * 60000).toISOString(),
  windowEnd:   new Date(now).toISOString(),
  durationMinutes: 60,
  events: [
    { id: 'e1', type: 'DOMAIN_MUTATION', timestamp: ts(2), severity: 'INFO', source: 'domain:PayrollBatch', description: 'PayrollBatchDispatched on PayrollBatch', correlationId: 'corr-001', causationId: undefined, causalChain: [], metadata: { aggregate_type: 'PayrollBatch', event_type: 'PayrollBatchDispatched' }, tenantId: 'tenant-acme' },
    { id: 'e2', type: 'DLQ_ENTRY', timestamp: ts(5), severity: 'HIGH', source: 'queue:payroll-jobs', description: 'DLQ entry: process-payroll on payroll-jobs failed after 3 retries — Connection timeout to external bank API', correlationId: 'corr-001', causationId: 'e1', causalChain: ['e1'], metadata: { queue_name: 'payroll-jobs', retry_count: 3, error: 'Connection timeout' } },
    { id: 'e3', type: 'SLO_BREACH', timestamp: ts(10), severity: 'HIGH', source: 'slo_measurements', description: 'SLO breach: payroll-job-success-rate value=0.94 (32.0% above threshold)', sloId: 'payroll-job-success-rate', correlationId: undefined, causationId: undefined, causalChain: [], metadata: { measured_value: 0.94, deviation_pct: 32, is_breach: true } },
    { id: 'e4', type: 'DLQ_ENTRY', timestamp: ts(12), severity: 'HIGH', source: 'queue:payroll-jobs', description: 'DLQ entry: process-payroll on payroll-jobs failed after 3 retries — Bank API 503', correlationId: 'corr-002', causationId: undefined, causalChain: ['e3'], metadata: { queue_name: 'payroll-jobs', retry_count: 3 } },
    { id: 'e5', type: 'SLO_BREACH', timestamp: ts(15), severity: 'CRITICAL', source: 'slo_measurements', description: 'SLO breach: dlq-spike value=8 (78.6% above threshold)', sloId: 'dlq-spike', causalChain: ['e3', 'e4'], metadata: { measured_value: 8, deviation_pct: 78.6, is_breach: true } },
    { id: 'e6', type: 'PROJECTION_STALE', timestamp: ts(18), severity: 'HIGH', source: 'projection:payroll', description: 'Projection stale: payroll domain, lag=245s, version=891', causalChain: ['e3'], metadata: { domain: 'payroll', lag_seconds: 245, version: 891 } },
    { id: 'e7', type: 'MITIGATION_PROPOSED', timestamp: ts(20), severity: 'INFO', source: 'mitigation-engine', description: 'Mitigation PROPOSED: drain_dlq on queue:all (system) — Generated from burn rate analysis', sloId: 'dlq-spike', causalChain: ['e5'], metadata: { action: 'drain_dlq', targetResource: 'queue:all' } },
    { id: 'e8', type: 'MITIGATION_EXECUTED', timestamp: ts(23), severity: 'HIGH', source: 'mitigation-engine', description: 'Mitigation EXECUTING: drain_dlq on queue:all (operator) — Operator confirmed execution', sloId: 'dlq-spike', causalChain: ['e7'], metadata: { action: 'drain_dlq', actor: 'operator' } },
    { id: 'e9', type: 'MITIGATION_STABILIZING', timestamp: ts(24), severity: 'INFO', source: 'mitigation-engine', description: 'Mitigation STABILIZING: drain_dlq on queue:all — Stabilizing for 15m', sloId: 'dlq-spike', causalChain: ['e8'], metadata: { action: 'drain_dlq', windowMs: 900000 } },
    { id: 'e10', type: 'SLO_RECOVERY', timestamp: ts(35), severity: 'INFO', source: 'slo_measurements', description: 'SLO recovery: dlq-spike value=2 returned to passing', sloId: 'dlq-spike', causalChain: ['e8', 'e9'], metadata: { measured_value: 2, is_breach: false } },
    { id: 'e11', type: 'MITIGATION_RESOLVED', timestamp: ts(40), severity: 'INFO', source: 'mitigation-engine', description: 'Mitigation RESOLVED: drain_dlq on queue:all (system) — SLO returned to passing', sloId: 'dlq-spike', causalChain: ['e10'], metadata: { action: 'drain_dlq' } },
    { id: 'e12', type: 'SLO_RECOVERY', timestamp: ts(45), severity: 'INFO', source: 'slo_measurements', description: 'SLO recovery: payroll-job-success-rate returned to passing', sloId: 'payroll-job-success-rate', causalChain: [], metadata: { measured_value: 0.9997, is_breach: false } },
  ],
  summary: { sloBreaches: 2, dlqEntries: 2, projectionStales: 1, mitigationsFired: 1, domainMutations: 1 },
};

// ── Event Styling ─────────────────────────────────────────────────────────────

const EVENT_META: Record<IncidentEventType, { icon: any; color: string; bgColor: string; label: string }> = {
  SLO_BREACH:             { icon: AlertTriangle, color: 'text-red-400',     bgColor: 'bg-red-500/15 border-red-500/30',     label: 'SLO Breach' },
  SLO_RECOVERY:           { icon: CheckCircle,   color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', label: 'SLO Recovery' },
  DLQ_ENTRY:              { icon: Inbox,         color: 'text-orange-400',  bgColor: 'bg-orange-500/12 border-orange-500/25', label: 'DLQ Entry' },
  PROJECTION_STALE:       { icon: Database,      color: 'text-amber-400',   bgColor: 'bg-amber-500/12 border-amber-500/25',  label: 'Projection Stale' },
  MITIGATION_PROPOSED:    { icon: Shield,        color: 'text-blue-400',    bgColor: 'bg-blue-500/10 border-blue-500/20',    label: 'Mitigation Proposed' },
  MITIGATION_EXECUTED:    { icon: Zap,           color: 'text-indigo-400',  bgColor: 'bg-indigo-500/15 border-indigo-500/30', label: 'Mitigation Executed' },
  MITIGATION_STABILIZING: { icon: Activity,      color: 'text-purple-400',  bgColor: 'bg-purple-500/10 border-purple-500/20', label: 'Stabilizing' },
  MITIGATION_RESOLVED:    { icon: CheckCircle,   color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', label: 'Mitigation Resolved' },
  MITIGATION_ROLLED_BACK: { icon: RefreshCw,     color: 'text-red-400',     bgColor: 'bg-red-500/15 border-red-500/30',     label: 'Rolled Back' },
  DOMAIN_MUTATION:        { icon: GitBranch,     color: 'text-slate-400',   bgColor: 'bg-slate-700/30 border-slate-600/30',  label: 'Domain Mutation' },
};

const SEV_DOT: Record<Severity, string> = {
  CRITICAL: 'bg-red-500',  HIGH: 'bg-orange-500', MEDIUM: 'bg-amber-500',
  LOW: 'bg-blue-500',      INFO: 'bg-slate-500',
};

type Filter = 'all' | 'breach' | 'mitigation' | 'infrastructure';

function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function fmtDate(iso: string) { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

// ── Component ─────────────────────────────────────────────────────────────────

export function IncidentReplayView() {
  const [timeline]  = useState<IncidentTimeline>(DEMO_TIMELINE);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [showCausal, setShowCausal] = useState(false);

  const FILTER_FN: Record<Filter, (e: IncidentEvent) => boolean> = {
    all:            () => true,
    breach:         e  => e.type === 'SLO_BREACH' || e.type === 'DLQ_ENTRY',
    mitigation:     e  => e.type.startsWith('MITIGATION'),
    infrastructure: e  => e.type === 'PROJECTION_STALE' || e.type === 'DOMAIN_MUTATION' || e.type === 'SLO_RECOVERY',
  };

  const visible = timeline.events.filter(FILTER_FN[filter]);
  const selectedEvent = selected ? timeline.events.find(e => e.id === selected) : null;
  const causalOf = selectedEvent
    ? timeline.events.filter(e => selectedEvent.causalChain.includes(e.id))
    : [];
  const causedBy = selectedEvent
    ? timeline.events.filter(e => e.causalChain.includes(selectedEvent.id))
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Incident Reconstruction</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {fmtDate(timeline.windowStart)} → {fmtDate(timeline.windowEnd)} · {timeline.durationMinutes}m window
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold">{timeline.summary.sloBreaches} breaches</span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-bold">{timeline.summary.dlqEntries} DLQ</span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold">{timeline.summary.mitigationsFired} mitigations</span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/60 border border-slate-600/40 text-slate-400 text-[10px]">{timeline.events.length} events total</span>
        </div>
      </div>

      {/* Filters + causal toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'breach', 'mitigation', 'infrastructure'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'}`}>
            {f}
          </button>
        ))}
        <button onClick={() => setShowCausal(!showCausal)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${showCausal ? 'bg-indigo-600 text-white' : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'}`}>
          <Link className="h-3 w-3" /> Causal Links
        </button>
      </div>

      <div className="flex gap-3">
        {/* Timeline */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {visible.map((event, idx) => {
            const meta    = EVENT_META[event.type];
            const Icon    = meta.icon;
            const isSelected = selected === event.id;
            const isHighlighted = showCausal && selectedEvent && (
              selectedEvent.causalChain.includes(event.id) ||
              event.causalChain.includes(selectedEvent.id)
            );

            return (
              <div key={event.id}
                onClick={() => setSelected(isSelected ? null : event.id)}
                className={`relative flex items-start gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected      ? `${meta.bgColor} ring-1 ring-indigo-500/40` :
                  isHighlighted   ? 'bg-indigo-500/10 border-indigo-500/30' :
                  'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'
                }`}>
                {/* Timeline spine */}
                {idx < visible.length - 1 && (
                  <div className="absolute left-5 top-8 w-px h-full bg-slate-700/40" />
                )}
                {/* Icon */}
                <div className={`mt-0.5 p-1 rounded-lg flex-shrink-0 ${meta.bgColor} border`}>
                  <Icon className={`h-3 w-3 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${SEV_DOT[event.severity]}`} />
                    <span className="text-[10px] font-semibold text-slate-300">{meta.label}</span>
                    {event.correlationId && (
                      <span className="hidden sm:flex items-center gap-0.5 text-[9px] text-slate-600 font-mono">
                        <Link className="h-2 w-2" /> {event.correlationId.slice(-8)}
                      </span>
                    )}
                    {event.causalChain.length > 0 && showCausal && (
                      <span className="text-[9px] text-indigo-400 font-semibold">← {event.causalChain.length} cause{event.causalChain.length > 1 ? 's' : ''}</span>
                    )}
                    <span className="ml-auto text-[10px] text-slate-500 flex-shrink-0">{fmtTime(event.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{event.description}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5 font-mono">{event.source}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Causal detail panel */}
        {selectedEvent && (
          <div className="w-64 flex-shrink-0 space-y-3">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Selected Event</p>
              <p className="text-xs font-bold text-slate-200">{EVENT_META[selectedEvent.type].label}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{selectedEvent.description}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Clock className="h-3 w-3" /> {fmtTime(selectedEvent.timestamp)}
              </div>
            </div>

            {causalOf.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/30 space-y-1.5">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 rotate-180" /> Caused By
                </p>
                {causalOf.map(e => {
                  const m = EVENT_META[e.type];
                  const I = m.icon;
                  return (
                    <div key={e.id} className="flex items-start gap-1.5 cursor-pointer" onClick={() => setSelected(e.id)}>
                      <I className={`h-3 w-3 mt-0.5 ${m.color} flex-shrink-0`} />
                      <span className="text-[10px] text-slate-400 truncate">{e.description.slice(0, 60)}…</span>
                    </div>
                  );
                })}
              </div>
            )}

            {causedBy.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/30 space-y-1.5">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" /> Caused Events
                </p>
                {causedBy.map(e => {
                  const m = EVENT_META[e.type];
                  const I = m.icon;
                  return (
                    <div key={e.id} className="flex items-start gap-1.5 cursor-pointer" onClick={() => setSelected(e.id)}>
                      <I className={`h-3 w-3 mt-0.5 ${m.color} flex-shrink-0`} />
                      <span className="text-[10px] text-slate-400 truncate">{e.description.slice(0, 60)}…</span>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedEvent.sloId && (
              <div className="p-2 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <span className="text-[10px] text-slate-500">SLO: </span>
                <span className="text-[10px] text-indigo-400 font-mono">{selectedEvent.sloId}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Layer legend */}
      <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
        {(Object.entries(EVENT_META) as [IncidentEventType, typeof EVENT_META[IncidentEventType]][]).map(([type, m]) => {
          const I = m.icon;
          return (
            <span key={type} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <I className={`h-2.5 w-2.5 ${m.color}`} />
              <span>{m.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
