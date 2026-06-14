'use client';
import { useState } from 'react';
import {
  CheckCircle, Zap, AlertTriangle, Clock, ChevronRight,
  RotateCcw, PauseCircle, Slash, Trash2, Activity,
  ArrowRight, Shield, CornerDownLeft,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type MitigationState = 'PROPOSED' | 'ACKNOWLEDGED' | 'EXECUTING' | 'STABILIZING' | 'RESOLVED' | 'ROLLED_BACK';
type MitigationActionType = 'reduce_concurrency' | 'pause_queue' | 'priority_rebuild' | 'circuit_break' | 'drain_dlq';
type Urgency = 'CRITICAL' | 'HIGH' | 'MEDIUM';

interface MitigationTransition { from: MitigationState; to: MitigationState; actor: string; reason?: string; at: string }
interface Signal {
  id: string; sloId: string; targetResource: string;
  action: MitigationActionType; recommendation: string;
  autoExecutable: boolean; urgency: Urgency; parameter?: number | string;
  triggerReason: string; state: MitigationState;
  transitions: MitigationTransition[]; lastTransitionAt: string;
  stabilizingUntil?: string; generatedAt: string;
}

// ── Demo Data ─────────────────────────────────────────────────────────────────

function ago(min: number) { return new Date(Date.now() - min * 60000).toISOString(); }
const SIGNALS: Signal[] = [
  {
    id: '1', sloId: 'projection-rebuild-lag', targetResource: 'projection:workforce',
    action: 'priority_rebuild', urgency: 'CRITICAL', autoExecutable: true, parameter: undefined,
    recommendation: 'Projection fast-burn (16.2× over 1h). Immediate kpi-snapshot rebuild triggered.',
    triggerReason: '1h burn rate 16.2× ≥ fast threshold 14×',
    state: 'STABILIZING', stabilizingUntil: new Date(Date.now() + 8 * 60000).toISOString(),
    lastTransitionAt: ago(2), generatedAt: ago(12),
    transitions: [
      { from: 'PROPOSED', to: 'PROPOSED', actor: 'system', reason: 'Generated from burn rate analysis', at: ago(12) },
      { from: 'PROPOSED', to: 'EXECUTING', actor: 'system', reason: 'Auto-execution initiated', at: ago(11) },
      { from: 'EXECUTING', to: 'STABILIZING', actor: 'system', reason: 'Stabilizing for 15m', at: ago(2) },
    ],
  },
  {
    id: '2', sloId: 'dlq-spike', targetResource: 'queue:all',
    action: 'drain_dlq', urgency: 'CRITICAL', autoExecutable: false, parameter: undefined,
    recommendation: 'DLQ fast-burn: 6 entries this hour. Navigate to DLQ Manager and replay/dismiss.',
    triggerReason: 'DLQ 1h burn rate 16.2× ≥ fast threshold',
    state: 'PROPOSED', lastTransitionAt: ago(8), generatedAt: ago(8),
    transitions: [
      { from: 'PROPOSED', to: 'PROPOSED', actor: 'system', reason: 'Generated from burn rate analysis', at: ago(8) },
    ],
  },
  {
    id: '3', sloId: 'ai-recompute-latency', targetResource: 'queue:ai-jobs',
    action: 'reduce_concurrency', urgency: 'HIGH', autoExecutable: false, parameter: 2,
    recommendation: 'AI slow-burn (8.4× over 1h). Throttle scheduled AI insights until latency recovers.',
    triggerReason: '1h burn rate 8.4× above slow threshold 6×',
    state: 'ACKNOWLEDGED', lastTransitionAt: ago(15), generatedAt: ago(25),
    transitions: [
      { from: 'PROPOSED', to: 'PROPOSED', actor: 'system', reason: 'Generated from burn rate analysis', at: ago(25) },
      { from: 'PROPOSED', to: 'ACKNOWLEDGED', actor: 'operator', reason: 'Operator acknowledged', at: ago(15) },
    ],
  },
  {
    id: '4', sloId: 'dlq-spike', targetResource: 'queue:notifications',
    action: 'circuit_break', urgency: 'HIGH', autoExecutable: false,
    recommendation: 'DLQ slow-burn (5.1× over 6h). Disable non-critical notification fanout.',
    triggerReason: 'DLQ 6h burn rate 5.1× ≥ slow threshold',
    state: 'RESOLVED', lastTransitionAt: ago(30), generatedAt: ago(90),
    transitions: [
      { from: 'PROPOSED', to: 'PROPOSED', actor: 'system', at: ago(90) },
      { from: 'PROPOSED', to: 'ACKNOWLEDGED', actor: 'operator', at: ago(80) },
      { from: 'ACKNOWLEDGED', to: 'EXECUTING', actor: 'operator', reason: 'Operator confirmed', at: ago(75) },
      { from: 'EXECUTING', to: 'STABILIZING', actor: 'system', at: ago(70) },
      { from: 'STABILIZING', to: 'RESOLVED', actor: 'system', reason: 'SLO returned to passing', at: ago(30) },
    ],
  },
];

// ── Static maps ───────────────────────────────────────────────────────────────

const ACTION_META: Record<MitigationActionType, { icon: any; label: string; color: string }> = {
  priority_rebuild:   { icon: RotateCcw,   label: 'Priority Rebuild',   color: 'text-indigo-400' },
  reduce_concurrency: { icon: Activity,    label: 'Reduce Concurrency',  color: 'text-amber-400'  },
  drain_dlq:          { icon: Trash2,      label: 'Drain DLQ',           color: 'text-red-400'    },
  circuit_break:      { icon: Slash,       label: 'Circuit Break',       color: 'text-orange-400' },
  pause_queue:        { icon: PauseCircle, label: 'Pause Queue',         color: 'text-yellow-400' },
};

const STATE_STYLE: Record<MitigationState, { label: string; dot: string; badge: string }> = {
  PROPOSED:     { label: 'Proposed',     dot: 'bg-blue-500',    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  ACKNOWLEDGED: { label: 'Acknowledged', dot: 'bg-yellow-500',  badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  EXECUTING:    { label: 'Executing',    dot: 'bg-orange-500 animate-pulse', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  STABILIZING:  { label: 'Stabilizing',  dot: 'bg-purple-500 animate-pulse', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  RESOLVED:     { label: 'Resolved',     dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  ROLLED_BACK:  { label: 'Rolled Back',  dot: 'bg-slate-500',   badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
};

const URGENCY_BORDER: Record<Urgency, string> = {
  CRITICAL: 'border-red-500/25', HIGH: 'border-amber-500/25', MEDIUM: 'border-slate-600/50',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${(m / 60).toFixed(1)}h ago`;
}
function countdown(iso: string) {
  const rem = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000));
  return `${rem}m`;
}
const TERMINAL: MitigationState[] = ['RESOLVED', 'ROLLED_BACK'];

// ── Component ─────────────────────────────────────────────────────────────────

type Filter = 'active' | 'all' | 'resolved';

export function MitigationView() {
  const [signals, setSignals] = useState<Signal[]>(SIGNALS);
  const [filter, setFilter]   = useState<Filter>('active');
  const [expanded, setExpanded] = useState<string | null>(null);

  const applyTransition = (id: string, to: MitigationState, actor = 'operator', reason?: string) => {
    setSignals(prev => prev.map(s => {
      if (s.id !== id) return s;
      const now = new Date().toISOString();
      const t: MitigationTransition = { from: s.state, to, actor, reason, at: now };
      return { ...s, state: to, lastTransitionAt: now, transitions: [...s.transitions, t] };
    }));
  };

  const visible = signals.filter(s =>
    filter === 'active'   ? !TERMINAL.includes(s.state) :
    filter === 'resolved' ? TERMINAL.includes(s.state)  : true,
  );

  const activeCount   = signals.filter(s => !TERMINAL.includes(s.state)).length;
  const criticalCount = signals.filter(s => s.urgency === 'CRITICAL' && !TERMINAL.includes(s.state)).length;
  const stabCount     = signals.filter(s => s.state === 'STABILIZING').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Mitigation Signals</h1>
          <p className="text-xs text-slate-400 mt-0.5">Operational recommendations · state machine · oscillation prevention</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
              <Zap className="h-3 w-3" /> {criticalCount} CRITICAL
            </span>
          )}
          {stabCount > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold">
              <Shield className="h-3 w-3" /> {stabCount} Stabilizing
            </span>
          )}
          <span className="px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-400 text-xs">
            {activeCount} active
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['active', 'all', 'resolved'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'}`}>
            {f} ({f === 'active' ? activeCount : f === 'resolved' ? signals.filter(s => TERMINAL.includes(s.state)).length : signals.length})
          </button>
        ))}
      </div>

      {/* Signal cards */}
      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="py-16 flex flex-col items-center text-slate-600">
            <CheckCircle className="h-10 w-10 mb-3 text-emerald-500/50" />
            <p className="text-slate-400 font-semibold">No signals</p>
          </div>
        )}

        {visible.map(s => {
          const meta  = ACTION_META[s.action];
          const ss    = STATE_STYLE[s.state];
          const Icon  = meta.icon;
          const isOpen = expanded === s.id;
          const terminal = TERMINAL.includes(s.state);

          return (
            <div key={s.id}
              className={`rounded-2xl border transition-all ${terminal ? 'opacity-55 bg-slate-800/20 border-slate-700/20' : `bg-slate-800/60 ${URGENCY_BORDER[s.urgency]}`}`}>

              <button onClick={() => setExpanded(isOpen ? null : s.id)}
                className="w-full text-left p-3.5 flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${ss.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                    <span className="text-xs font-bold text-slate-200">{meta.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${ss.badge}`}>{ss.label}</span>
                    {s.autoExecutable && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AUTO</span>
                    )}
                    {s.state === 'STABILIZING' && s.stabilizingUntil && (
                      <span className="flex items-center gap-1 text-[9px] text-purple-400 font-semibold">
                        <Clock className="h-2.5 w-2.5" /> {countdown(s.stabilizingUntil)} remaining
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 ml-auto">{relTime(s.generatedAt)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{s.recommendation}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{s.targetResource}</p>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 text-slate-500 mt-1 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-700/30 space-y-3">
                  {/* Detail */}
                  <div className="pt-3 space-y-2">
                    <p className="text-[11px] text-slate-300 leading-relaxed">{s.recommendation}</p>
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40">
                      <p className="text-[10px] text-slate-500 font-semibold mb-0.5">TRIGGER REASON</p>
                      <p className="text-[11px] text-slate-400">{s.triggerReason}</p>
                    </div>
                    {s.parameter !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Suggested parameter:</span>
                        <span className="text-xs font-bold text-indigo-300 font-mono">{s.parameter}</span>
                      </div>
                    )}
                  </div>

                  {/* Transition Timeline */}
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-1.5 uppercase tracking-wider">Lifecycle</p>
                    <div className="space-y-1">
                      {s.transitions.filter((t, i) => i > 0 || t.from !== t.to).map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-500 font-mono w-14 flex-shrink-0">{new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-slate-500">{t.from === t.to ? t.to : `${t.from}`}</span>
                          {t.from !== t.to && <ArrowRight className="h-2.5 w-2.5 text-slate-600" />}
                          {t.from !== t.to && <span className="text-slate-300 font-semibold">{t.to}</span>}
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500">{t.actor}</span>
                          {t.reason && <span className="text-slate-600 truncate">{t.reason}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {!terminal && (
                    <div className="flex gap-2 flex-wrap">
                      {s.state === 'PROPOSED' && (
                        <button onClick={() => applyTransition(s.id, 'ACKNOWLEDGED')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 text-xs font-semibold hover:bg-yellow-600/30 transition">
                          <CheckCircle className="h-3 w-3" /> Acknowledge
                        </button>
                      )}
                      {s.state === 'ACKNOWLEDGED' && (
                        <>
                          <button onClick={() => applyTransition(s.id, 'EXECUTING', 'operator', 'Operator confirmed execution')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-300 text-xs font-semibold hover:bg-orange-600/30 transition">
                            <Zap className="h-3 w-3" /> Execute
                          </button>
                          <button onClick={() => applyTransition(s.id, 'RESOLVED', 'operator', 'Dismissed — SLO self-corrected')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/30 transition">
                            <CheckCircle className="h-3 w-3" /> Dismiss
                          </button>
                        </>
                      )}
                      {s.state === 'STABILIZING' && (
                        <button onClick={() => applyTransition(s.id, 'ROLLED_BACK', 'operator', 'Adverse effect detected')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-600/30 transition">
                          <CornerDownLeft className="h-3 w-3" /> Rollback
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* State machine legend */}
      <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500">
        {(Object.entries(STATE_STYLE) as [MitigationState, typeof STATE_STYLE[MitigationState]][]).map(([state, s]) => (
          <span key={state} className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot.replace(' animate-pulse', '')}`} />
            <span className="font-semibold text-slate-400">{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
