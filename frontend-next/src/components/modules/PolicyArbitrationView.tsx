'use client';
import { useState, useMemo } from 'react';
import {
 CheckCircle, XCircle, Clock, ChevronDown, Layers, AlertTriangle,
 Shield, Inbox, GitBranch, Database, ArrowRight, ChevronRight,
 Activity, Info, Zap, Lock,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────────────────── */ type ArbitrationVerdict = 'ALLOWED' | 'BLOCKED' | 'DEFERRED' | 'DOWNGRADED';
type Urgency = 'CRITICAL' | 'HIGH' | 'MEDIUM';

interface ArbitrationDecision {
 policyId: string;
 policyName: string;
 verdict: ArbitrationVerdict;
 blockedBySignalIds: string[];
 triggeredRuleIds: string[];
 reason: string;
 downgradeFrom?: Urgency;
 downgradeTo?: Urgency;
}

interface Conflict {
 resource: string;
 winner: string;
 losers: string[];
 ruleId: string;
}

interface ArbitrationReport {
 decisions: ArbitrationDecision[];
 allowed: { policy: { id: string; name: string; urgency: Urgency; action: string; targetResource: string } }[];
 blocked: { policy: { id: string; name: string; urgency: Urgency; action: string; targetResource: string } }[];
 deferred: { policy: { id: string; name: string; urgency: Urgency; action: string; targetResource: string } }[];
 conflicts: Conflict[];
 evaluatedAt: string;
}

interface ConflictRule {
 id: string; name: string; description: string;
 activeAction: string; activeResource: string;
 candidateAction: string; candidateResource: string;
 verdict: string; reason: string; rationale: string;
 disabled?: boolean;
}

/* ── Demo Data ───────────────────────────────────────────────────────────────── */ const NOW = new Date().toISOString();

const DEMO_REPORT: ArbitrationReport = {
 evaluatedAt: NOW,
 allowed: [
 { policy: { id: 'p-proj-fast', name: 'Projection Fast-Burn Rebuild', urgency: 'CRITICAL', action: 'priority_rebuild', targetResource: 'projection:workforce' } },
 ],
 blocked: [
 { policy: { id: 'p-dlq-circuit', name: 'DLQ Slow-Burn Circuit Break', urgency: 'HIGH', action: 'circuit_break', targetResource: 'queue:notifications' } },
 ],
 deferred: [
 { policy: { id: 'p-ai-slow', name: 'AI Slow-Burn Throttle', urgency: 'HIGH', action: 'reduce_concurrency', targetResource: 'queue:ai-jobs' } },
 ],
 decisions: [
 { policyId: 'p-proj-fast', policyName: 'Projection Fast-Burn Rebuild', verdict: 'ALLOWED', blockedBySignalIds: [], triggeredRuleIds: [], reason: 'No conflict detected' },
 { policyId: 'p-dlq-circuit', policyName: 'DLQ Slow-Burn Circuit Break', verdict: 'BLOCKED', blockedBySignalIds: ['sig-pause-7f2a'], triggeredRuleIds: ['cr-pause-then-circuit'], reason: 'Queue is already paused — adding circuit_break creates double suppression and no recovery path.' },
 { policyId: 'p-ai-slow', policyName: 'AI Slow-Burn Throttle', verdict: 'DEFERRED', blockedBySignalIds: [], triggeredRuleIds: ['intra-tick-resource-mutex'], reason: 'Resource queue:ai-jobs already claimed by higher-priority candidate p-ai-fast this tick' },
 ],
 conflicts: [
 { resource: 'queue:notifications', winner: 'active-signal (pause_queue)', losers: ['p-dlq-circuit'], ruleId: 'cr-pause-then-circuit' },
 { resource: 'queue:ai-jobs', winner: 'p-ai-fast', losers: ['p-ai-slow'], ruleId: 'intra-tick-resource-mutex' },
 ],
};

const DEMO_RULES: ConflictRule[] = [
 { id: 'cr-pause-then-circuit', name: 'Double Queue Suppression', verdict: 'BLOCK', description: 'Prevent circuit_break when queue is already paused', activeAction: 'pause_queue', activeResource: 'queue:*', candidateAction: 'circuit_break', candidateResource: 'queue:*', reason: 'Queue is already paused — adding circuit_break creates double suppression and no recovery path.', rationale: 'pause_queue already stops all job processing. circuit_break would block reconnection attempts, leaving no automatic recovery mechanism.', disabled: false },
 { id: 'cr-circuit-then-pause', name: 'Circuit Breaker + Pause Conflict', verdict: 'DEFER', description: 'Prevent pause_queue when circuit is broken', activeAction: 'circuit_break', activeResource: 'queue:*', candidateAction: 'pause_queue', candidateResource: 'queue:*', reason: 'Circuit break is active — defer queue pause until circuit recovers.', rationale: 'Both actions suppress job processing. Applying both simultaneously extends total downtime and removes the circuit breaker\'s ability to auto-recover.', disabled: false },
 { id: 'cr-reduce-concurrency-rebuild', name: 'Concurrency Reduction + Rebuild Conflict', verdict: 'DEFER', description: 'Prevent high-priority rebuild when worker concurrency is reduced', activeAction: 'reduce_concurrency', activeResource: 'queue:ai-jobs', candidateAction: 'priority_rebuild', candidateResource: 'projection:*', reason: 'AI worker concurrency already reduced — high-priority rebuild may overload remaining capacity.', rationale: 'priority_rebuild adds high-urgency jobs competing for CPU with throttled AI workers.', disabled: false },
 { id: 'cr-rebuild-then-reduce', name: 'Rebuild in Flight + Concurrency Reduction', verdict: 'DOWNGRADE', description: 'Downgrade concurrency reduction during active rebuild', activeAction: 'priority_rebuild', activeResource: 'projection:*', candidateAction: 'reduce_concurrency', candidateResource: 'queue:ai-jobs', reason: 'Active rebuild in progress — reduce_concurrency downgraded to MEDIUM.', rationale: 'Reducing concurrency while a rebuild is executing reduces throughput for the rebuild itself, extending the stabilization window.', disabled: false },
 { id: 'cr-drain-then-reduce', name: 'DLQ Drain + Concurrency Reduction', verdict: 'BLOCK', description: 'Block concurrency reduction during active DLQ drain', activeAction: 'drain_dlq', activeResource: 'queue:all', candidateAction: 'reduce_concurrency', candidateResource: 'queue:*', reason: 'DLQ drain is in progress — reducing concurrency now would slow the drain and extend the incident window.', rationale: 'DLQ drain relies on available worker capacity to process queued failures.', disabled: false },
 { id: 'cr-same-resource-lower-urgency', name: 'Same Resource Lower Urgency', verdict: 'DEFER', description: 'Block lower-urgency actions when CRITICAL mitigation active on same resource', activeAction: '*', activeResource: '*', candidateAction: '*', candidateResource: '*', reason: 'A CRITICAL mitigation is already active — deferring lower-urgency action to next tick.', rationale: 'Multiple concurrent mitigations on the same resource create state conflicts and make it impossible to attribute outcome effectiveness.', disabled: false },
];

/* ── Styling ─────────────────────────────────────────────────────────────────── */ const VERDICT_STYLE: Record<ArbitrationVerdict, { label: string; color: string; bg: string; border: string; icon: any }> = {
 ALLOWED: { label: 'Allowed', color: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/30', icon: CheckCircle },
 BLOCKED: { label: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/12', border: 'border-red-500/30', icon: XCircle },
 DEFERRED: { label: 'Deferred', color: 'text-amber-400', bg: 'bg-slate-50mber-500/12', border: 'border-amber-500/30', icon: Clock },
 DOWNGRADED: { label: 'Downgraded', color: 'text-blue-400', bg: 'bg-blue-500/12', border: 'border-blue-500/30', icon: ChevronDown },
};

const URGENCY_STYLE: Record<Urgency, string> = {
 CRITICAL: 'text-red-400 bg-red-500/15 border-red-500/30',
 HIGH: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
 MEDIUM: 'text-amber-400 bg-slate-50mber-500/15 border-amber-500/30',
};

const RULE_VERDICT_COLOR: Record<string, string> = {
 BLOCK: 'text-red-400 bg-red-500/15 border-red-500/30',
 DEFER: 'text-amber-400 bg-slate-50mber-500/12 border-amber-500/30',
 DOWNGRADE: 'text-blue-400 bg-blue-500/12 border-blue-500/30',
};

type Tab = 'decisions' | 'conflicts' | 'rules';

/* ── Component ───────────────────────────────────────────────────────────────── */ export function PolicyArbitrationView() {
 const [tab, setTab] = useState<Tab>('decisions');
 const [expandedRule, setExpRule] = useState<string | null>(null);
 const [expandedDec, setExpDec] = useState<string | null>(null);

 const report = DEMO_REPORT;
 const rules = DEMO_RULES;
 const dec = report.decisions;

 const stats = useMemo(() => ({
 total: dec.length,
 allowed: dec.filter(d => d.verdict === 'ALLOWED').length,
 blocked: dec.filter(d => d.verdict === 'BLOCKED').length,
 deferred: dec.filter(d => d.verdict === 'DEFERRED').length,
 downgraded: dec.filter(d => d.verdict === 'DOWNGRADED').length,
 }), [dec]);

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-start justify-between flex-wrap gap-3">
 <div>
 <h1 className="text-xl font-bold text-slate-100">Policy Arbitration</h1>
 <p className="text-xs text-slate-500 mt-0.5">
 Cross-policy conflict resolution · resource mutex · urgency priority · confidence tiebreaker
 </p>
 </div>
 <div className="text-[10px] text-slate-500 font-mono bg-slate-50/50 px-2 py-1 rounded-lg border border-slate-200/30">
 Last tick: {new Date(report.evaluatedAt).toLocaleTimeString()}
 </div>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-4 gap-2">
 {([
 { label: 'Allowed', count: stats.allowed, verdict: 'ALLOWED' as ArbitrationVerdict },
 { label: 'Blocked', count: stats.blocked, verdict: 'BLOCKED' as ArbitrationVerdict },
 { label: 'Deferred', count: stats.deferred, verdict: 'DEFERRED' as ArbitrationVerdict },
 { label: 'Downgraded', count: stats.downgraded, verdict: 'DOWNGRADED' as ArbitrationVerdict },
 ] as const).map(({ label, count, verdict }) => {
 const s = VERDICT_STYLE[verdict];
 const I = s.icon;
 return (
 <div key={label} className={`p-3 rounded-xl border ${s.bg} ${s.border}`}>
 <div className="flex items-center gap-1.5 mb-1">
 <I className={`h-3 w-3 ${s.color}`} />
 <span className={`text-[10px] font-bold ${s.color}`}>{label}</span>
 </div>
 <p className={`text-2xl font-black ${s.color}`}>{count}</p>
 </div>
 );
 })}
 </div>

 {/* Tabs */}
 <div className="flex gap-1 p-1 bg-slate-50/50 rounded-xl border border-slate-200/30 w-fit">
 {(['decisions', 'conflicts', 'rules'] as Tab[]).map(t => (
 <button key={t} onClick={() => setTab(t)}
 className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
 {t}
 </button>
 ))}
 </div>

 {/* ── Decisions Tab ──────────────────────────────────────────────────── */}
 {tab === 'decisions' && (
 <div className="space-y-2">
 {dec.map(d => {
 const s = VERDICT_STYLE[d.verdict];
 const I = s.icon;
 const isExp = expandedDec === d.policyId;

 return (
 <div key={d.policyId}
 className={`rounded-xl border transition-all cursor-pointer ${s.bg} ${s.border}`}
 onClick={() => setExpDec(isExp ? null : d.policyId)}>
 <div className="flex items-center gap-3 p-3">
 <I className={`h-4 w-4 flex-shrink-0 ${s.color}`} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-xs font-bold text-slate-700">{d.policyName}</span>
 {d.downgradeFrom && (
 <span className="flex items-center gap-1 text-[10px] text-blue-300">
 <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${URGENCY_STYLE[d.downgradeFrom]}`}>{d.downgradeFrom}</span>
 <ArrowRight className="h-2.5 w-2.5" />
 <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${URGENCY_STYLE[d.downgradeTo!]}`}>{d.downgradeTo}</span>
 </span>
 )}
 </div>
 <p className="text-[10px] text-slate-500 mt-0.5 truncate">{d.reason}</p>
 </div>
 <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 ${s.color}`}>{s.label}</span>
 <ChevronRight className={`h-3.5 w-3.5 text-slate-600 flex-shrink-0 transition-transform ${isExp ? 'rotate-90' : ''}`} />
 </div>
 {isExp && (
 <div className="px-4 pb-3 pt-0 border-t border-slate-200/20 space-y-2">
 {d.triggeredRuleIds.length > 0 && (
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-[9px] text-slate-500 font-semibold uppercase">Triggered rules:</span>
 {d.triggeredRuleIds.map(r => (
 <span key={r} className="text-[9px] font-mono text-slate-500 bg-slate-50/60 px-2 py-0.5 rounded border border-slate-200/30">{r}</span>
 ))}
 </div>
 )}
 {d.blockedBySignalIds.length > 0 && (
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-[9px] text-slate-500 font-semibold uppercase">Active signals:</span>
 {d.blockedBySignalIds.map(s => (
 <span key={s} className="text-[9px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{s}</span>
 ))}
 </div>
 )}
 <p className="text-[11px] text-slate-500 leading-relaxed">{d.reason}</p>
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}

 {/* ── Conflicts Tab ──────────────────────────────────────────────────── */}
 {tab === 'conflicts' && (
 <div className="space-y-3">
 {report.conflicts.length === 0 && (
 <div className="text-center p-8 text-slate-600 text-sm">
 <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-600/40" />
 No conflicts this tick
 </div>
 )}
 {report.conflicts.map((c, i) => (
 <div key={i} className="p-3 rounded-xl bg-slate-50/50 border border-slate-200/30 space-y-2">
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-mono text-amber-400 bg-slate-50mber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{c.resource}</span>
 <span className="text-[10px] text-slate-500 font-semibold uppercase">conflict</span>
 <span className="text-[9px] font-mono text-slate-600">rule: {c.ruleId}</span>
 </div>
 <div className="flex items-center gap-3 flex-wrap">
 <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
 <CheckCircle className="h-3 w-3 text-emerald-400" />
 <span className="text-[10px] text-emerald-300 font-semibold">{c.winner}</span>
 </div>
 <ArrowRight className="h-3 w-3 text-slate-600" />
 {c.losers.map(l => (
 <div key={l} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25">
 <XCircle className="h-3 w-3 text-red-400" />
 <span className="text-[10px] text-red-300 font-semibold">{l}</span>
 </div>
 ))}
 </div>
 </div>
 ))}

 {/* Conflict pipeline visualization */}
 <div className="p-3 rounded-xl bg-slate-50/30 border border-slate-200/20 space-y-2">
 <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Evaluation Pipeline</p>
 <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
 {[
 { label: 'BurnRates', color: 'text-slate-500 bg-slate-700/40' },
 { label: '→' },
 { label: 'Policy Engine', color: 'text-indigo-400 bg-indigo-500/12' },
 { label: `→ ${dec.length} matches` },
 { label: 'Arbitration', color: 'text-amber-400 bg-slate-50mber-500/12' },
 { label: `→ ${stats.allowed} allowed` },
 { label: 'Signal Service', color: 'text-emerald-400 bg-emerald-500/12' },
 ].map((item, i) => item.color ? (
 <span key={i} className={`px-2 py-0.5 rounded-md font-semibold border border-slate-200/30 ${item.color}`}>{item.label}</span>
 ) : (
 <span key={i} className="text-slate-600">{item.label}</span>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* ── Rules Tab ─────────────────────────────────────────────────────── */}
 {tab === 'rules' && (
 <div className="space-y-2">
 {rules.map(r => {
 const vs = RULE_VERDICT_COLOR[r.verdict] ?? 'text-slate-500';
 const isExp = expandedRule === r.id;
 return (
 <div key={r.id}
 className={`rounded-xl border transition-all ${r.disabled ? 'opacity-50 border-slate-200/20 bg-slate-50/20' : 'bg-slate-50/40 border-slate-200/30 hover:border-slate-600/40'}`}>
 <div className="flex items-start gap-3 p-3 cursor-pointer" onClick={() => setExpRule(isExp ? null : r.id)}>
 <Lock className="h-3.5 w-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-xs font-bold text-slate-700">{r.name}</span>
 <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${vs}`}>{r.verdict}</span>
 {r.disabled && <span className="text-[9px] text-slate-600 font-semibold">DISABLED</span>}
 </div>
 <p className="text-[10px] text-slate-500 mt-0.5">{r.description}</p>
 </div>
 <ChevronRight className={`h-3.5 w-3.5 text-slate-600 flex-shrink-0 transition-transform mt-0.5 ${isExp ? 'rotate-90' : ''}`} />
 </div>
 {isExp && (
 <div className="px-4 pb-3 pt-0 border-t border-slate-200/20 space-y-2.5">
 {/* Pattern */}
 <div className="p-2.5 rounded-xl bg-white/50 border border-slate-200/20">
 <p className="text-[9px] text-slate-600 font-semibold uppercase mb-1.5">Conflict Pattern</p>
 <div className="flex items-center gap-2 flex-wrap text-[10px]">
 <div className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
 <p className="text-[9px] text-slate-500">active action</p>
 <p className="font-mono text-red-300">{r.activeAction}</p>
 <p className="font-mono text-slate-500 text-[9px]">{r.activeResource}</p>
 </div>
 <span className="text-slate-600">+ candidate</span>
 <div className="px-2 py-1 rounded-lg bg-slate-50mber-500/10 border border-amber-500/20 text-center">
 <p className="text-[9px] text-slate-500">candidate action</p>
 <p className="font-mono text-amber-300">{r.candidateAction}</p>
 <p className="font-mono text-slate-500 text-[9px]">{r.candidateResource}</p>
 </div>
 <ArrowRight className="h-3 w-3 text-slate-600" />
 <span className={`px-2 py-1 rounded-lg font-bold text-[10px] border ${vs}`}>{r.verdict}</span>
 </div>
 </div>
 {/* Reason */}
 <div>
 <p className="text-[9px] text-slate-500 font-semibold uppercase mb-1">Operator Message</p>
 <p className="text-[11px] text-slate-600">{r.reason}</p>
 </div>
 {/* Rationale */}
 <div>
 <p className="text-[9px] text-slate-500 font-semibold uppercase mb-1">Engineering Rationale</p>
 <p className="text-[10px] text-slate-500 leading-relaxed">{r.rationale}</p>
 </div>
 <span className="text-[9px] font-mono text-slate-700">rule-id: {r.id}</span>
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}

 {/* Footer */}
 <div className="flex items-start gap-2 text-[10px] text-slate-600">
 <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-700" />
 <span>
 DEFERRED matches re-enter arbitration on the next 5-minute evaluation tick without consuming dedup window.
 BLOCKED matches are not dedup-registered — they become eligible again if the conflicting signal resolves.
 DOWNGRADED matches proceed with reduced urgency; operators receive the adjusted recommendation.
 </span>
 </div>
 </div>
 );
}
