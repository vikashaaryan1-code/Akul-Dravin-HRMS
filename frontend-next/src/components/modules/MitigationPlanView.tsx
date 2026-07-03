'use client';
import { useState } from 'react';
import {
 GitBranch, Play, StopCircle, CheckCircle, XCircle, Clock,
 ChevronRight, AlertTriangle, Layers, ArrowDown, UserCheck,
 Activity, Zap, BarChart2, Shield, RefreshCw, Info,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────────────────── */ type StepState = 'PENDING' | 'EXECUTING' | 'AWAITING_SUCCESS' | 'SUCCEEDED' | 'FAILED' | 'COMPENSATING' | 'SKIPPED';
type PlanState = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'COMPENSATING' | 'ABORTED';

interface StepExecution {
 stepId: string; stepName: string; state: StepState;
 signalId?: string; startedAt?: string; completedAt?: string;
 failureReason?: string; eligibleAfter?: string;
}
interface PlanExecution {
 id: string; planId: string; planName: string; state: PlanState;
 steps: StepExecution[]; startedAt: string; completedAt?: string;
 correlationId?: string; log: Array<{ at: string; message: string }>;
}
interface PlanDef {
 id: string; name: string; description: string; triggerHint: string;
 steps: Array<{ id: string; name: string; action: string; targetResource: string; prerequisites: string[]; urgency: string; criticalPath: boolean }>;
}

/* ── Demo Data ───────────────────────────────────────────────────────────────── */ const NOW = Date.now();
const iso = (offset: number) => new Date(NOW - offset * 60000).toISOString();

const DEMO_EXECUTIONS: PlanExecution[] = [
 {
 id: 'exec-1', planId: 'plan-dlq-recovery', planName: 'DLQ Recovery Pipeline',
 state: 'RUNNING', startedAt: iso(18), correlationId: 'corr-7a9f',
 log: [
 { at: iso(18), message: 'Plan started: DLQ Recovery Pipeline' },
 { at: iso(13), message: 'Step "Circuit Break Failing Consumer" ready — injecting into evaluation' },
 { at: iso(12), message: 'Step "Circuit Break Failing Consumer" executing (signal=sig-7f2a)' },
 { at: iso(7), message: 'Step "Circuit Break Failing Consumer" SUCCEEDED' },
 { at: iso(7), message: 'Step "Drain DLQ" ready — injecting into evaluation' },
 { at: iso(6), message: 'Step "Drain DLQ" executing (signal=sig-9b1c)' },
 ],
 steps: [
 { stepId: 'step-circuit', stepName: 'Circuit Break Failing Consumer', state: 'SUCCEEDED', signalId: 'sig-7f2a', startedAt: iso(12), completedAt: iso(7) },
 { stepId: 'step-drain', stepName: 'Drain DLQ', state: 'EXECUTING', signalId: 'sig-9b1c', startedAt: iso(6) },
 { stepId: 'step-rebuild', stepName: 'Rebuild Stale Projections', state: 'PENDING' },
 ],
 },
 {
 id: 'exec-2', planId: 'plan-projection-lag', planName: 'Projection Lag Recovery Pipeline',
 state: 'SUCCEEDED', startedAt: iso(95), completedAt: iso(55),
 log: [
 { at: iso(95), message: 'Plan started' },
 { at: iso(90), message: 'Step "Throttle AI Job Concurrency" executing' },
 { at: iso(87), message: 'Step "Throttle AI Job Concurrency" SUCCEEDED' },
 { at: iso(87), message: 'Step "Priority Rebuild Workforce Projection" ready' },
 { at: iso(85), message: 'Step "Priority Rebuild Workforce Projection" executing' },
 { at: iso(55), message: 'Step "Priority Rebuild Workforce Projection" SUCCEEDED' },
 { at: iso(55), message: 'Plan SUCCEEDED in 40m' },
 ],
 steps: [
 { stepId: 'step-throttle', stepName: 'Throttle AI Job Concurrency', state: 'SUCCEEDED', startedAt: iso(90), completedAt: iso(87) },
 { stepId: 'step-rebuild-proj', stepName: 'Priority Rebuild Workforce Projection', state: 'SUCCEEDED', startedAt: iso(85), completedAt: iso(55) },
 ],
 },
];

const DEMO_PLANS: PlanDef[] = [
 {
 id: 'plan-dlq-recovery', name: 'DLQ Recovery Pipeline',
 description: 'Isolate failing consumer → drain DLQ → rebuild stale projections',
 triggerHint: 'dlq-spike SLO breach with queue depth > 500',
 steps: [
 { id: 's1', name: 'Circuit Break Failing Consumer', action: 'circuit_break', targetResource: 'queue:notifications', prerequisites: [], urgency: 'HIGH', criticalPath: true },
 { id: 's2', name: 'Drain DLQ', action: 'drain_dlq', targetResource: 'queue:all', prerequisites: ['s1'], urgency: 'HIGH', criticalPath: true },
 { id: 's3', name: 'Rebuild Stale Projections', action: 'priority_rebuild', targetResource: 'projection:workforce', prerequisites: ['s2'], urgency: 'MEDIUM', criticalPath: false },
 ],
 },
 {
 id: 'plan-projection-lag', name: 'Projection Lag Recovery Pipeline',
 description: 'Throttle AI workload → rebuild stale projections',
 triggerHint: 'projection-lag or ai-recompute SLO with staleness > 15min',
 steps: [
 { id: 's1', name: 'Throttle AI Job Concurrency', action: 'reduce_concurrency', targetResource: 'queue:ai-jobs', prerequisites: [], urgency: 'HIGH', criticalPath: true },
 { id: 's2', name: 'Priority Rebuild Workforce Projection', action: 'priority_rebuild', targetResource: 'projection:workforce', prerequisites: ['s1'], urgency: 'HIGH', criticalPath: true },
 ],
 },
 {
 id: 'plan-fast-burn-emergency', name: 'Fast Burn Emergency Response',
 description: 'Full suppression pipeline with operator-gated advancement',
 triggerHint: 'Any SLO fast burn rate × 14 (1h window)',
 steps: [
 { id: 's1', name: 'Pause AI Job Queue', action: 'pause_queue', targetResource: 'queue:ai-jobs', prerequisites: [], urgency: 'CRITICAL', criticalPath: true },
 { id: 's2', name: 'Drain All DLQs', action: 'drain_dlq', targetResource: 'queue:all', prerequisites: ['s1'], urgency: 'HIGH', criticalPath: true },
 { id: 's3', name: 'Full Domain Rebuild', action: 'priority_rebuild', targetResource: 'projection:all-domains', prerequisites: ['s2'], urgency: 'HIGH', criticalPath: false },
 ],
 },
];

/* ── Step State Styles ───────────────────────────────────────────────────────── */ const STEP_STYLE: Record<StepState, { label: string; color: string; bg: string; border: string; icon: any }> = {
 PENDING: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-50/60', border: 'border-slate-200/40', icon: Clock },
 EXECUTING: { label: 'Executing', color: 'text-blue-400', bg: 'bg-blue-500/12', border: 'border-blue-500/30', icon: Activity },
 AWAITING_SUCCESS:{ label: 'Awaiting', color: 'text-amber-400', bg: 'bg-slate-50mber-500/12', border: 'border-amber-500/30', icon: RefreshCw },
 SUCCEEDED: { label: 'Succeeded', color: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/30', icon: CheckCircle },
 FAILED: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/12', border: 'border-red-500/30', icon: XCircle },
 COMPENSATING: { label: 'Compensating', color: 'text-orange-400', bg: 'bg-orange-500/12', border: 'border-orange-500/30', icon: Shield },
 SKIPPED: { label: 'Skipped', color: 'text-slate-600', bg: 'bg-slate-50/30', border: 'border-slate-200/20', icon: ChevronRight },
};

const PLAN_STATE_STYLE: Record<PlanState, { label: string; color: string; bg: string; border: string }> = {
 RUNNING: { label: 'Running', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
 SUCCEEDED: { label: 'Succeeded', color: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/30' },
 FAILED: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/12', border: 'border-red-500/30' },
 COMPENSATING: { label: 'Compensating',color: 'text-orange-400', bg: 'bg-orange-500/12', border: 'border-orange-500/30' },
 ABORTED: { label: 'Aborted', color: 'text-slate-500', bg: 'bg-slate-50/60', border: 'border-slate-200/40' },
};

function relTime(iso: string) {
 const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
 return m < 60 ? `${m}m ago` : `${(m / 60).toFixed(1)}h ago`;
}

/* ── Plan Library Card ───────────────────────────────────────────────────────── */ function PlanLibraryCard({ plan, onStart }: { plan: PlanDef; onStart: (id: string) => void }) {
 const [expanded, setExpanded] = useState(false);
 return (
 <div className="rounded-2xl border border-slate-200/30 bg-slate-50/40 overflow-hidden">
 <div className="flex items-start gap-3 p-3.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
 <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
 <Layers className="h-3.5 w-3.5 text-indigo-400" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-slate-700">{plan.name}</p>
 <p className="text-[10px] text-slate-500 mt-0.5">{plan.description}</p>
 <p className="text-[9px] text-indigo-500 mt-1 font-semibold">{plan.steps.length} steps · {plan.triggerHint}</p>
 </div>
 <button
 onClick={e => { e.stopPropagation(); onStart(plan.id); }}
 className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/25 border border-indigo-500/35 text-indigo-300 text-[10px] font-semibold hover:bg-indigo-600/40 transition flex-shrink-0">
 <Play className="h-3 w-3" /> Start
 </button>
 </div>
 {expanded && (
 <div className="px-3.5 pb-3.5 pt-0 border-t border-slate-200/20">
 <div className="mt-2.5 space-y-1.5">
 {plan.steps.map((step, idx) => (
 <div key={step.id} className="flex items-center gap-2">
 {idx > 0 && (
 <div className="flex flex-col items-center" style={{ marginLeft: '14px', marginRight: '-14px' }}>
 <ArrowDown className="h-2.5 w-2.5 text-slate-700 -mt-1 -mb-0.5" />
 </div>
 )}
 <div className={`flex-1 flex items-center gap-2 p-2 rounded-lg border text-[10px] ${step.criticalPath ? 'bg-slate-50/60 border-slate-200/40' : 'bg-slate-50/30 border-slate-200/20'}`}>
 <span className={`font-mono px-1.5 py-0.5 rounded text-[8px] font-bold ${step.urgency === 'CRITICAL' ? 'bg-red-500/15 text-red-400' : step.urgency === 'HIGH' ? 'bg-slate-50mber-500/12 text-amber-400' : 'bg-slate-700 text-slate-500'}`}>{step.urgency}</span>
 <span className="font-semibold text-slate-600">{step.name}</span>
 <span className="text-slate-600 ml-auto font-mono">{step.action}</span>
 <span className="text-slate-700 font-mono">{step.targetResource}</span>
 {!step.criticalPath && <span className="text-[8px] text-slate-600 border border-slate-200/40 px-1 rounded">optional</span>}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}

/* ── Execution Timeline ──────────────────────────────────────────────────────── */ function ExecutionTimeline({ exec }: { exec: PlanExecution }) {
 const [showLog, setShowLog] = useState(false);
 const ps = PLAN_STATE_STYLE[exec.state];

 return (
 <div className={`rounded-2xl border overflow-hidden ${exec.state === 'RUNNING' ? 'border-blue-500/25 bg-slate-50/50' : 'border-slate-200/30 bg-slate-50/40'}`}>
 {/* Header */}
 <div className="flex items-start gap-3 p-3.5">
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${ps.bg} ${ps.border} border`}>
 <GitBranch className={`h-3.5 w-3.5 ${ps.color}`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-xs font-bold text-slate-700">{exec.planName}</span>
 <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${ps.bg} ${ps.border} ${ps.color}`}>{ps.label}</span>
 </div>
 <p className="text-[10px] text-slate-600 mt-0.5">
 Started {relTime(exec.startedAt)}
 {exec.completedAt && ` · Completed ${relTime(exec.completedAt)}`}
 {exec.correlationId && ` · corr=${exec.correlationId}`}
 </p>
 </div>
 <div className="flex items-center gap-1.5">
 <button onClick={() => setShowLog(!showLog)} className="text-[9px] text-slate-600 hover:text-slate-500 border border-slate-200/30 px-2 py-1 rounded transition">
 {showLog ? 'Hide' : 'Log'}
 </button>
 {exec.state === 'RUNNING' && (
 <button className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/25 text-red-400 text-[9px] hover:bg-red-500/20 transition">
 <StopCircle className="h-3 w-3" /> Abort
 </button>
 )}
 </div>
 </div>

 {/* Step Timeline */}
 <div className="px-3.5 pb-3.5 space-y-0">
 {exec.steps.map((step, idx) => {
 const ss = STEP_STYLE[step.state];
 const I = ss.icon;
 return (
 <div key={step.stepId} className="flex gap-2.5">
 {/* Connector */}
 <div className="flex flex-col items-center">
 <div className={`w-6 h-6 rounded-full flex items-center justify-center ${ss.bg} ${ss.border} border flex-shrink-0`}>
 <I className={`h-3 w-3 ${ss.color}`} />
 </div>
 {idx < exec.steps.length - 1 && (
 <div className={`w-px flex-1 min-h-[16px] ${step.state === 'SUCCEEDED' ? 'bg-emerald-500/30' : 'bg-slate-700/30'}`} />
 )}
 </div>

 {/* Step content */}
 <div className={`flex-1 pb-2 ${idx === exec.steps.length - 1 ? 'pb-0' : ''}`}>
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[10px] font-bold ${ss.color}`}>{step.stepName}</span>
 <span className={`text-[8px] px-1.5 py-0.5 rounded border ${ss.bg} ${ss.border} ${ss.color}`}>{ss.label}</span>
 {step.signalId && <span className="text-[8px] font-mono text-slate-600">sig={step.signalId}</span>}
 </div>
 {(step.startedAt || step.failureReason) && (
 <p className="text-[9px] text-slate-600 mt-0.5">
 {step.startedAt && `Started ${relTime(step.startedAt)}`}
 {step.completedAt && ` · done ${relTime(step.completedAt)}`}
 {step.failureReason && ` · ⛔ ${step.failureReason}`}
 </p>
 )}
 </div>
 </div>
 );
 })}
 </div>

 {/* Event log */}
 {showLog && (
 <div className="mx-3.5 mb-3.5 p-2.5 rounded-xl bg-white/60 border border-slate-200/20 max-h-40 overflow-y-auto">
 {[...exec.log].reverse().map((entry, i) => (
 <div key={i} className="flex gap-2 text-[9px] py-0.5">
 <span className="text-slate-700 flex-shrink-0 font-mono">{relTime(entry.at)}</span>
 <span className="text-slate-500">{entry.message}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

/* ── Main View ───────────────────────────────────────────────────────────────── */ export function MitigationPlanView() {
 const [tab, setTab] = useState<'executions' | 'library'>('executions');

 const running = DEMO_EXECUTIONS.filter(e => e.state === 'RUNNING');
 const completed = DEMO_EXECUTIONS.filter(e => e.state !== 'RUNNING');

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-start justify-between flex-wrap gap-3">
 <div>
 <h1 className="text-xl font-bold text-slate-100">Mitigation Plan Orchestrator</h1>
 <p className="text-xs text-slate-500 mt-0.5">
 Multi-step workflows · prerequisite sequencing · compensation on failure
 </p>
 </div>
 <div className="flex items-center gap-2 text-[10px]">
 <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold">
 {running.length} running
 </span>
 <span className="px-2.5 py-1 rounded-xl bg-slate-50/70 border border-slate-200/40 text-slate-500">
 {DEMO_PLANS.length} plans in library
 </span>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 bg-slate-50/50 rounded-xl p-1 border border-slate-200/30">
 {(['executions', 'library'] as const).map(t => (
 <button key={t} onClick={() => setTab(t)}
 className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${tab === t ? 'bg-slate-700/70 text-slate-700' : 'text-slate-500 hover:text-slate-500'}`}>
 {t === 'executions' ? `Executions (${DEMO_EXECUTIONS.length})` : `Plan Library (${DEMO_PLANS.length})`}
 </button>
 ))}
 </div>

 {/* Tab content */}
 {tab === 'executions' && (
 <div className="space-y-3">
 {running.length > 0 && (
 <div className="space-y-2">
 <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Active</p>
 {running.map(e => <ExecutionTimeline key={e.id} exec={e} />)}
 </div>
 )}
 {completed.length > 0 && (
 <div className="space-y-2">
 <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Completed</p>
 {completed.map(e => <ExecutionTimeline key={e.id} exec={e} />)}
 </div>
 )}
 </div>
 )}

 {tab === 'library' && (
 <div className="space-y-2">
 {DEMO_PLANS.map(plan => (
 <PlanLibraryCard key={plan.id} plan={plan} onStart={(id) => console.log('Start plan:', id)} />
 ))}
 <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50/30 border border-slate-200/20 text-[10px] text-slate-600">
 <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-700" />
 <span>
 Plans create synthetic PolicyMatches for each ready step and inject them into the normal
 arbitration pipeline. Steps go through the full conflict rule evaluation before execution.
 Compensation steps run automatically on critical path failures.
 </span>
 </div>
 </div>
 )}
 </div>
 );
}
