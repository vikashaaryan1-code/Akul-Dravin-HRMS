'use client';
import { useState } from 'react';
import {
  Play, Zap, Shield, Clock, CheckCircle, XCircle, AlertTriangle,
  BarChart2, ChevronRight, ChevronDown, Info, TrendingUp, Activity,
  RefreshCw, Award,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type SimRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Recommendation = 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'REVIEW_BEFORE_PROCEEDING' | 'ABORT';

interface StepSim {
  stepId: string; stepName: string; action: string; targetResource: string;
  conflictProbability: number; estimatedDurationMin: number; successProbability: number;
  blastRadius: number; criticalPathRisk: SimRisk; notes: string[];
}
interface SimResult {
  planId: string; planName: string; overallSuccessProbability: number;
  expectedDurationP50Min: number; expectedDurationP90Min: number;
  contentionProbability: number; highestRiskStep: StepSim | null;
  steps: StepSim[]; overallRisk: SimRisk; recommendation: Recommendation;
  recommendationReason: string; simulatedAt: string;
}
interface PlanDef { id: string; name: string; description: string; triggerHint: string }

// ── Demo Data ─────────────────────────────────────────────────────────────────

const PLANS: PlanDef[] = [
  { id: 'plan-dlq-recovery',        name: 'DLQ Recovery Pipeline',        description: 'Isolate consumer → drain DLQ → rebuild projections',     triggerHint: 'dlq-spike SLO breach' },
  { id: 'plan-projection-lag',      name: 'Projection Lag Recovery',       description: 'Throttle AI workload → rebuild projections',              triggerHint: 'projection-lag > 15min' },
  { id: 'plan-fast-burn-emergency', name: 'Fast Burn Emergency Response',  description: 'Full suppression with operator approval gates',            triggerHint: 'fast burn × 14 (1h window)' },
];

const SIM_RESULTS: Record<string, SimResult> = {
  'plan-dlq-recovery': {
    planId: 'plan-dlq-recovery', planName: 'DLQ Recovery Pipeline',
    overallSuccessProbability: 0.76, expectedDurationP50Min: 21, expectedDurationP90Min: 33,
    contentionProbability: 0.52, overallRisk: 'MEDIUM',
    recommendation: 'PROCEED_WITH_CAUTION',
    recommendationReason: 'Success probability 76%. Plan is not yet marked recommended — insufficient execution history.',
    simulatedAt: new Date().toISOString(),
    highestRiskStep: null,
    steps: [
      { stepId: 's1', stepName: 'Circuit Break Failing Consumer', action: 'circuit_break', targetResource: 'queue:notifications', conflictProbability: 0.35, estimatedDurationMin: 5, successProbability: 0.89, blastRadius: 0.40, criticalPathRisk: 'MEDIUM', notes: ['1 active signal on queue:notifications — deferral likely', '+3m estimated deferral overhead'] },
      { stepId: 's2', stepName: 'Drain DLQ',                     action: 'drain_dlq',     targetResource: 'queue:all',           conflictProbability: 0.0,  estimatedDurationMin: 7, successProbability: 0.84, blastRadius: 0.90, criticalPathRisk: 'CRITICAL', notes: ['No execution history — estimate based on blast radius proxy', 'High blast radius — platform-wide impact if step fails'] },
      { stepId: 's3', stepName: 'Rebuild Stale Projections',      action: 'priority_rebuild', targetResource: 'projection:workforce', conflictProbability: 0.0, estimatedDurationMin: 9, successProbability: 0.91, blastRadius: 0.60, criticalPathRisk: 'LOW', notes: ['Non-critical path — plan continues on failure'] },
    ],
  },
  'plan-projection-lag': {
    planId: 'plan-projection-lag', planName: 'Projection Lag Recovery',
    overallSuccessProbability: 0.91, expectedDurationP50Min: 13, expectedDurationP90Min: 16,
    contentionProbability: 0.18, overallRisk: 'LOW',
    recommendation: 'PROCEED',
    recommendationReason: 'Success probability 91% from 12 executions. Low contention. Plan is recommended.',
    simulatedAt: new Date().toISOString(),
    highestRiskStep: null,
    steps: [
      { stepId: 's1', stepName: 'Throttle AI Job Concurrency',            action: 'reduce_concurrency', targetResource: 'queue:ai-jobs',        conflictProbability: 0.0, estimatedDurationMin: 3,  successProbability: 0.95, blastRadius: 0.50, criticalPathRisk: 'MEDIUM', notes: ['Based on 12 historical executions'] },
      { stepId: 's2', stepName: 'Priority Rebuild Workforce Projection',  action: 'priority_rebuild',   targetResource: 'projection:workforce', conflictProbability: 0.0, estimatedDurationMin: 10, successProbability: 0.92, blastRadius: 0.60, criticalPathRisk: 'HIGH',   notes: ['Based on 12 historical executions'] },
    ],
  },
  'plan-fast-burn-emergency': {
    planId: 'plan-fast-burn-emergency', planName: 'Fast Burn Emergency Response',
    overallSuccessProbability: 0.38, expectedDurationP50Min: 60, expectedDurationP90Min: 75,
    contentionProbability: 0.71, overallRisk: 'CRITICAL',
    recommendation: 'ABORT',
    recommendationReason: 'Success probability 38% is below safe threshold (40%). Review plan conditions.',
    simulatedAt: new Date().toISOString(),
    highestRiskStep: null,
    steps: [
      { stepId: 's1', stepName: 'Pause AI Job Queue',   action: 'pause_queue',    targetResource: 'queue:ai-jobs', conflictProbability: 0.70, estimatedDurationMin: 45, successProbability: 0.55, blastRadius: 0.50, criticalPathRisk: 'HIGH',   notes: ['No execution history — estimate based on blast radius proxy', '+38m estimated deferral overhead', 'OPERATOR_CONFIRMED — 15m human response estimate'] },
      { stepId: 's2', stepName: 'Drain All DLQs',       action: 'drain_dlq',     targetResource: 'queue:all',      conflictProbability: 0.35, estimatedDurationMin: 15, successProbability: 0.75, blastRadius: 0.90, criticalPathRisk: 'CRITICAL', notes: ['High blast radius — platform-wide impact if step fails'] },
      { stepId: 's3', stepName: 'Full Domain Rebuild',  action: 'priority_rebuild', targetResource: 'projection:all-domains', conflictProbability: 0.0, estimatedDurationMin: 15, successProbability: 0.78, blastRadius: 0.90, criticalPathRisk: 'LOW', notes: ['Non-critical path — plan continues on failure'] },
    ],
  },
};

// Attach highestRiskStep
for (const result of Object.values(SIM_RESULTS)) {
  result.highestRiskStep = [...result.steps].sort((a, b) => b.blastRadius - a.blastRadius)[0] ?? null;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const RISK_STYLE: Record<SimRisk, { color: string; bg: string; border: string }> = {
  LOW:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  MEDIUM:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25'   },
  HIGH:     { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25'  },
  CRITICAL: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25'     },
};

const REC_STYLE: Record<Recommendation, { label: string; color: string; bg: string; border: string; icon: any }> = {
  PROCEED:                  { label: 'Proceed',                   color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: CheckCircle },
  PROCEED_WITH_CAUTION:     { label: 'Proceed with Caution',      color: 'text-amber-300',   bg: 'bg-amber-500/12',   border: 'border-amber-500/30',   icon: AlertTriangle },
  REVIEW_BEFORE_PROCEEDING: { label: 'Review Before Proceeding',  color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  icon: Shield },
  ABORT:                    { label: 'Abort — Unsafe',            color: 'text-red-300',     bg: 'bg-red-500/12',     border: 'border-red-500/30',     icon: XCircle },
};

function pct(v: number) { return `${Math.round(v * 100)}%`; }

function ProbBar({ value, danger = false }: { value: number; danger?: boolean }) {
  const color = danger
    ? (value > 0.6 ? 'bg-red-500' : value > 0.3 ? 'bg-amber-500' : 'bg-slate-600')
    : (value > 0.75 ? 'bg-emerald-500' : value > 0.5 ? 'bg-amber-500' : 'bg-red-500');
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 flex-1 rounded-full bg-slate-700/60 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className={`text-[10px] font-bold w-8 text-right ${color.replace('bg-', 'text-')}`}>{pct(value)}</span>
    </div>
  );
}

function StepCard({ step, idx }: { step: StepSim; idx: number }) {
  const [exp, setExp] = useState(false);
  const rs = RISK_STYLE[step.criticalPathRisk];
  return (
    <div className={`rounded-xl border ${step.criticalPathRisk === 'CRITICAL' ? 'border-red-500/25 bg-red-500/5' : 'border-slate-700/25 bg-slate-800/40'} overflow-hidden`}>
      <div className="flex items-start gap-3 p-2.5 cursor-pointer" onClick={() => setExp(!exp)}>
        <div className="w-5 h-5 rounded-full bg-slate-700/60 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-slate-400 mt-0.5">{idx + 1}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-200">{step.stepName}</span>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${rs.bg} ${rs.border} ${rs.color}`}>{step.criticalPathRisk}</span>
            <span className="text-[9px] font-mono text-slate-600">{step.action}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-1.5 text-[9px]">
            <div><span className="text-slate-600">Success</span><ProbBar value={step.successProbability} /></div>
            <div><span className="text-slate-600">Conflict</span><ProbBar value={step.conflictProbability} danger /></div>
            <div><span className="text-slate-600">~Duration</span><p className="font-bold text-slate-300">{step.estimatedDurationMin}m</p></div>
          </div>
        </div>
        {exp ? <ChevronDown className="h-3 w-3 text-slate-600 flex-shrink-0 mt-1" /> : <ChevronRight className="h-3 w-3 text-slate-600 flex-shrink-0 mt-1" />}
      </div>
      {exp && (
        <div className="px-2.5 pb-2.5 border-t border-slate-700/20 pt-2 space-y-1.5">
          <div className="flex gap-2 text-[9px]">
            <span className="text-slate-600">Resource:</span>
            <span className="font-mono text-slate-400">{step.targetResource}</span>
            <span className="text-slate-600 ml-3">Blast:</span>
            <ProbBar value={step.blastRadius} danger />
          </div>
          {step.notes.map((note, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[9px] text-slate-500">
              <span className="text-slate-700 flex-shrink-0">·</span> {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function WorkflowSimulationView() {
  const [selectedPlan, setSelectedPlan] = useState<string>('plan-projection-lag');
  const result = SIM_RESULTS[selectedPlan];
  const rec = REC_STYLE[result.recommendation];
  const RecIcon = rec.icon;
  const rs = RISK_STYLE[result.overallRisk];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Workflow Simulation</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Deterministic pre-execution analysis · conflict probability · P50/P90 duration · blast radius
        </p>
      </div>

      {/* Plan selector */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Select Plan to Simulate</p>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.map(plan => (
            <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
              className={`p-2.5 rounded-xl border text-left transition ${selectedPlan === plan.id ? 'bg-indigo-600/20 border-indigo-500/40' : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/40'}`}>
              <p className={`text-[10px] font-bold ${selectedPlan === plan.id ? 'text-indigo-300' : 'text-slate-300'}`}>{plan.name}</p>
              <p className="text-[9px] text-slate-600 mt-0.5 truncate">{plan.triggerHint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation banner */}
      <div className={`p-3 rounded-xl border ${rec.bg} ${rec.border} flex items-start gap-2.5`}>
        <RecIcon className={`h-4 w-4 ${rec.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`text-xs font-bold ${rec.color}`}>{rec.label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{result.recommendationReason}</p>
        </div>
        {result.recommendation === 'PROCEED' && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold hover:bg-emerald-600/45 transition flex-shrink-0">
            <Play className="h-3 w-3" /> Start Plan
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Success Prob',   value: pct(result.overallSuccessProbability), sub: 'overall', icon: Award,      color: result.overallSuccessProbability > 0.75 ? 'text-emerald-400' : result.overallSuccessProbability > 0.5 ? 'text-amber-400' : 'text-red-400' },
          { label: 'P50 Duration',   value: `${result.expectedDurationP50Min}m`,   sub: 'expected', icon: Clock,     color: 'text-slate-300' },
          { label: 'P90 Duration',   value: `${result.expectedDurationP90Min}m`,   sub: 'w/deferral',icon: TrendingUp,color: 'text-slate-400' },
          { label: 'Contention',     value: pct(result.contentionProbability),     sub: 'deferral risk', icon: Activity, color: result.contentionProbability > 0.5 ? 'text-red-400' : result.contentionProbability > 0.3 ? 'text-amber-400' : 'text-emerald-400' },
        ].map(s => {
          const I = s.icon;
          return (
            <div key={s.label} className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-1">
                <I className={`h-3 w-3 ${s.color}`} />
                <span className="text-[9px] text-slate-600">{s.label}</span>
              </div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-slate-700">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Overall risk badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${rs.bg} ${rs.border}`}>
        <Shield className={`h-3.5 w-3.5 ${rs.color}`} />
        <span className={`text-xs font-bold ${rs.color}`}>Overall Risk: {result.overallRisk}</span>
        {result.highestRiskStep && (
          <span className="text-[9px] text-slate-500 ml-2">
            Highest blast radius: {result.highestRiskStep.stepName} ({result.highestRiskStep.targetResource}, {pct(result.highestRiskStep.blastRadius)})
          </span>
        )}
      </div>

      {/* Step simulations */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Step Analysis</p>
        {result.steps.map((step, idx) => <StepCard key={step.stepId} step={step} idx={idx} />)}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 text-[10px] text-slate-600">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-700" />
        <span>
          Deterministic simulation based on active signal count, historical plan outcomes, and blast radius tables.
          P90 adds deferral overhead: conflictProb × 5min × (1 + conflictProb) per step.
          Overall success = product of critical-path step probabilities.
          Requires ≥ 3 plan executions for history-backed estimates.
        </span>
      </div>
    </div>
  );
}
