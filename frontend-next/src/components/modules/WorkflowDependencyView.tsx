'use client';
import { useState } from 'react';
import {
 AlertTriangle, GitBranch, CheckCircle, Clock, Zap, Shield,
 Activity, ArrowRight, ChevronDown, ChevronRight, Info,
 BarChart2, Link, Target, TrendingUp, Award,
} from 'lucide-react';

/* ── Demo types ──────────────────────────────────────────────────────────────── */

type NodeType = 'ACTIVE_SIGNAL' | 'DEFERRED_MATCH' | 'PLAN_STEP' | 'RESOURCE';
type EdgeType = 'HOLDS' | 'WAITS_FOR' | 'BLOCKED_BY';

interface WFNode { id: string; type: NodeType; label: string; meta?: { resource?: string; action?: string; urgency?: string; state?: string; waitingMs?: number; deferralCount?: number } }
interface WFEdge { from: string; to: string; type: EdgeType; label?: string }
interface Cycle { id: string; severity: 'DEADLOCK' | 'LIVELOCK_RISK'; path: string[]; pathLabels: string[]; involvedResources: string[]; description: string }
interface ResOwn { resource: string; owner: WFNode | null; waitingCount: number; waiting: Array<{ nodeId: string; nodeType: NodeType; label: string; waitingMs: number }>; contentionScore: number }
interface ChainEntry { chain: string[]; chainLabels: string[]; hopCount: number }
interface ConfRecord { planId: string; planName: string; successPct: number; compensationRate: number; medianDurationMin: number | null; totalExecutions: number; recommended: boolean }

/* ── Demo Data ───────────────────────────────────────────────────────────────── */ const DEMO_NODES: WFNode[] = [
 { id: 'sig:sig-9b1c', type: 'ACTIVE_SIGNAL', label: 'drain_dlq (sig-9b1c)', meta: { resource: 'queue:all', action: 'drain_dlq', urgency: 'HIGH', state: 'EXECUTING' } },
 { id: 'sig:sig-7f2a', type: 'ACTIVE_SIGNAL', label: 'circuit_break (sig-7f2a)', meta: { resource: 'queue:notifications', action: 'circuit_break', urgency: 'HIGH', state: 'STABILIZING' } },
 { id: 'dm:def-1', type: 'DEFERRED_MATCH', label: 'circuit_break (deferred 2×)', meta: { resource: 'queue:notifications', action: 'circuit_break', urgency: 'HIGH', waitingMs: 720000, deferralCount: 2 } },
 { id: 'dm:def-4', type: 'DEFERRED_MATCH', label: 'drain_dlq (deferred 0×)', meta: { resource: 'queue:notifications', action: 'drain_dlq', urgency: 'MEDIUM', waitingMs: 180000, deferralCount: 0 } },
 { id: 'step:exec-1:step-drain', type: 'PLAN_STEP', label: '[DLQ Recovery] Drain DLQ', meta: { state: 'EXECUTING' } },
 { id: 'step:exec-1:step-rebuild', type: 'PLAN_STEP', label: '[DLQ Recovery] Rebuild Projections', meta: { state: 'PENDING' } },
 { id: 'res:queue:all', type: 'RESOURCE', label: 'queue:all' },
 { id: 'res:queue:notifications', type: 'RESOURCE', label: 'queue:notifications' },
];

const DEMO_EDGES: WFEdge[] = [
 { from: 'sig:sig-9b1c', to: 'res:queue:all', type: 'HOLDS', label: 'EXECUTING' },
 { from: 'sig:sig-7f2a', to: 'res:queue:notifications', type: 'HOLDS', label: 'STABILIZING' },
 { from: 'dm:def-1', to: 'sig:sig-7f2a', type: 'WAITS_FOR', label: 'RESOURCE_BUSY' },
 { from: 'dm:def-4', to: 'res:queue:notifications', type: 'WAITS_FOR', label: 'RESOURCE_BUSY' },
 { from: 'step:exec-1:step-drain', to: 'sig:sig-9b1c', type: 'HOLDS', label: 'EXECUTING' },
 { from: 'step:exec-1:step-rebuild', to: 'step:exec-1:step-drain', type: 'WAITS_FOR', label: 'prerequisite' },
];

const DEMO_CYCLES: Cycle[] = []; /* No cycles in healthy state */ const DEMO_RESOURCE_OWN: ResOwn[] = [
 {
 resource: 'queue:all', contentionScore: 0.6,
 owner: DEMO_NODES[0],
 waitingCount: 0, waiting: [],
 },
 {
 resource: 'queue:notifications', contentionScore: 2.4,
 owner: DEMO_NODES[1],
 waitingCount: 2,
 waiting: [
 { nodeId: 'dm:def-1', nodeType: 'DEFERRED_MATCH', label: 'circuit_break (deferred 2×)', waitingMs: 720000 },
 { nodeId: 'dm:def-4', nodeType: 'DEFERRED_MATCH', label: 'drain_dlq (deferred 0×)', waitingMs: 180000 },
 ],
 },
];

const DEMO_LONG_CHAINS: ChainEntry[] = [
 { hopCount: 3, chain: ['step:exec-1:step-rebuild', 'step:exec-1:step-drain', 'sig:sig-9b1c', 'res:queue:all'], chainLabels: ['[DLQ Recovery] Rebuild Projections', 'Drain DLQ', 'drain_dlq (sig-9b1c)', 'queue:all'] },
];

const DEMO_CONFIDENCE: ConfRecord[] = [
 { planId: 'plan-projection-lag', planName: 'Projection Lag Recovery', successPct: 92, compensationRate: 8, medianDurationMin: 18, totalExecutions: 12, recommended: true },
 { planId: 'plan-dlq-recovery', planName: 'DLQ Recovery Pipeline', successPct: 75, compensationRate: 15, medianDurationMin: 24, totalExecutions: 8, recommended: true },
 { planId: 'plan-fast-burn-emergency', planName: 'Fast Burn Emergency', successPct: 40, compensationRate: 40, medianDurationMin: 55, totalExecutions: 5, recommended: false },
];

/* ── Helpers ─────────────────────────────────────────────────────────────────── */ const NODE_STYLE: Record<NodeType, { color: string; bg: string; border: string; icon: any }> = {
 ACTIVE_SIGNAL: { color: 'text-blue-400', bg: 'bg-blue-500/12', border: 'border-blue-500/30', icon: Activity },
 DEFERRED_MATCH: { color: 'text-amber-400', bg: 'bg-amber-500/12', border: 'border-amber-500/30', icon: Clock },
 PLAN_STEP: { color: 'text-indigo-400', bg: 'bg-indigo-500/12', border: 'border-indigo-500/30', icon: GitBranch },
 RESOURCE: { color: 'text-slate-500', bg: 'bg-slate-50/60', border: 'border-slate-200/40', icon: Target },
};

const EDGE_STYLE: Record<EdgeType, { color: string; label: string }> = {
 HOLDS: { color: 'text-emerald-500', label: 'HOLDS' },
 WAITS_FOR: { color: 'text-amber-500', label: 'WAITS FOR' },
 BLOCKED_BY:{ color: 'text-red-500', label: 'BLOCKED BY' },
};

function msToMin(ms: number) { return `${Math.round(ms / 60000)}m`; }

function NodeChip({ node }: { node: WFNode }) {
 const s = NODE_STYLE[node.type];
 const I = s.icon;
 return (
 <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border ${s.bg} ${s.border}`}>
 <I className={`h-3 w-3 ${s.color} flex-shrink-0`} />
 <span className={`text-[10px] font-semibold ${s.color} truncate max-w-[140px]`}>{node.label}</span>
 </div>
 );
}

/* ── Subcomponents ───────────────────────────────────────────────────────────── */ function ResourceOwnershipPanel({ ownership }: { ownership: ResOwn[] }) {
 return (
 <div className="space-y-2">
 <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Resource Ownership</p>
 {ownership.map(res => {
 const hot = res.contentionScore > 1.5;
 return (
 <div key={res.resource} className={`rounded-xl border p-3 ${hot ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-200/30 bg-slate-50/40'}`}>
 <div className="flex items-center gap-2 mb-2">
 <Target className={`h-3.5 w-3.5 ${hot ? 'text-amber-400' : 'text-slate-500'}`} />
 <span className="font-mono text-xs font-bold text-slate-600">{res.resource}</span>
 {hot && <span className="text-[8px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">HOT</span>}
 <span className="ml-auto text-[9px] text-slate-600">score: {res.contentionScore.toFixed(2)}</span>
 </div>
 <div className="flex items-start gap-4 text-[10px]">
 <div>
 <p className="text-slate-600 mb-0.5">Owner</p>
 {res.owner ? <NodeChip node={res.owner} /> : <span className="text-slate-700 italic">unowned</span>}
 </div>
 {res.waiting.length > 0 && (
 <div className="flex-1">
 <p className="text-slate-600 mb-1">Waiting ({res.waitingCount})</p>
 <div className="space-y-1">
 {res.waiting.map(w => (
 <div key={w.nodeId} className="flex items-center gap-2">
 <Clock className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />
 <span className="text-slate-500 truncate">{w.label}</span>
 <span className="text-slate-600 ml-auto">{msToMin(w.waitingMs)}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 );
}

function WaitChainPanel({ chains, nodeMap }: { chains: ChainEntry[]; nodeMap: Map<string, WFNode> }) {
 const [expanded, setExpanded] = useState<number | null>(null);
 if (chains.length === 0) return (
 <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50/30 border border-slate-200/20 text-[10px] text-slate-600">
 <CheckCircle className="h-3.5 w-3.5 text-emerald-600/50" /> No long wait chains detected.
 </div>
 );
 return (
 <div className="space-y-2">
 <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
 Long Wait Chains ({chains.length})
 </p>
 {chains.map((chain, idx) => (
 <div key={idx} className="rounded-xl border border-amber-500/25 bg-amber-500/5">
 <div className="flex items-center gap-2 p-2.5 cursor-pointer" onClick={() => setExpanded(expanded === idx ? null : idx)}>
 <Zap className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
 <span className="text-xs font-semibold text-amber-300">{chain.hopCount} hops</span>
 <span className="text-[10px] text-slate-500 truncate flex-1">{chain.chainLabels[0]} → … → {chain.chainLabels[chain.chainLabels.length - 1]}</span>
 {expanded === idx ? <ChevronDown className="h-3 w-3 text-slate-600" /> : <ChevronRight className="h-3 w-3 text-slate-600" />}
 </div>
 {expanded === idx && (
 <div className="px-2.5 pb-2.5 space-y-1">
 {chain.chain.map((nodeId, i) => {
 const node = nodeMap.get(nodeId);
 return (
 <div key={nodeId} className="flex items-center gap-1.5">
 {i > 0 && <ArrowRight className="h-2.5 w-2.5 text-amber-600/50 ml-1 flex-shrink-0" />}
 {node ? <NodeChip node={node} /> : <span className="text-[9px] font-mono text-slate-600">{nodeId}</span>}
 </div>
 );
 })}
 </div>
 )}
 </div>
 ))}
 </div>
 );
}

function EdgeListPanel({ edges, nodeMap }: { edges: WFEdge[]; nodeMap: Map<string, WFNode> }) {
 return (
 <div className="space-y-2">
 <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Edge List ({edges.length})</p>
 <div className="space-y-1">
 {edges.map((edge, i) => {
 const fromNode = nodeMap.get(edge.from);
 const toNode = nodeMap.get(edge.to);
 const es = EDGE_STYLE[edge.type];
 return (
 <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-200/60 last:border-0">
 {fromNode ? <NodeChip node={fromNode} /> : <span className="text-[9px] text-slate-700">{edge.from}</span>}
 <div className="flex items-center gap-1 flex-shrink-0">
 <div className="w-4 h-px bg-slate-700" />
 <span className={`text-[8px] font-black ${es.color} px-1 py-0.5 rounded bg-white/50`}>{es.label}</span>
 <div className="w-4 h-px bg-slate-700" />
 </div>
 {toNode ? <NodeChip node={toNode} /> : <span className="text-[9px] text-slate-700">{edge.to}</span>}
 </div>
 );
 })}
 </div>
 </div>
 );
}

function ConfidencePanel({ records }: { records: ConfRecord[] }) {
 return (
 <div className="space-y-2">
 <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Plan Outcome Intelligence</p>
 {records.map(rec => (
 <div key={rec.planId} className={`rounded-xl border p-3 ${rec.recommended ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-slate-200/25 bg-slate-50/30'}`}>
 <div className="flex items-start justify-between gap-2 mb-2">
 <div>
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-bold text-slate-700">{rec.planName}</span>
 {rec.recommended && <Award className="h-3.5 w-3.5 text-emerald-400" />}
 </div>
 <span className="text-[9px] text-slate-600">{rec.totalExecutions} executions</span>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-2 text-[10px]">
 <div>
 <p className="text-slate-600 mb-0.5">Success</p>
 <div className="flex items-center gap-1">
 <div className="h-1 flex-1 bg-slate-700/60 rounded-full overflow-hidden">
 <div className={`h-full rounded-full ${rec.successPct >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${rec.successPct}%` }} />
 </div>
 <span className={`font-bold ${rec.successPct >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{rec.successPct}%</span>
 </div>
 </div>
 <div>
 <p className="text-slate-600 mb-0.5">Compensation</p>
 <div className="flex items-center gap-1">
 <div className="h-1 flex-1 bg-slate-700/60 rounded-full overflow-hidden">
 <div className={`h-full rounded-full ${rec.compensationRate < 30 ? 'bg-slate-600' : 'bg-orange-500'}`} style={{ width: `${rec.compensationRate}%` }} />
 </div>
 <span className={`font-bold ${rec.compensationRate < 30 ? 'text-slate-500' : 'text-orange-400'}`}>{rec.compensationRate}%</span>
 </div>
 </div>
 <div>
 <p className="text-slate-600 mb-0.5">Median Duration</p>
 <span className="font-bold text-slate-600">{rec.medianDurationMin !== null ? `${rec.medianDurationMin}m` : '—'}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 );
}

/* ── Main View ───────────────────────────────────────────────────────────────── */ export function WorkflowDependencyView() {
 const [tab, setTab] = useState<'ownership' | 'chains' | 'edges' | 'confidence'>('ownership');

 const nodeMap = new Map(DEMO_NODES.map(n => [n.id, n]));

 const stats = {
 nodes: DEMO_NODES.length,
 edges: DEMO_EDGES.length,
 cycles: DEMO_CYCLES.length,
 chains: DEMO_LONG_CHAINS.length,
 waiters: DEMO_RESOURCE_OWN.reduce((s, r) => s + r.waitingCount, 0),
 hotspots: DEMO_RESOURCE_OWN.filter(r => r.contentionScore > 1.5).length,
 };

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-start justify-between flex-wrap gap-3">
 <div>
 <h1 className="text-xl font-bold text-slate-100">Workflow Dependency Graph</h1>
 <p className="text-xs text-slate-500 mt-0.5">
 Wait-for graph · deadlock detection · resource contention · plan outcome intelligence
 </p>
 </div>
 <div className="flex items-center gap-2 text-[10px] flex-wrap">
 {DEMO_CYCLES.length > 0 ? (
 <span className="px-2.5 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold">
 ⛔ {DEMO_CYCLES.length} DEADLOCK{DEMO_CYCLES.length > 1 ? 'S' : ''}
 </span>
 ) : (
 <span className="px-2.5 py-1 rounded-xl bg-emerald-500/12 border border-emerald-500/25 text-emerald-400 font-semibold">
 ✓ No cycles
 </span>
 )}
 {stats.hotspots > 0 && (
 <span className="px-2.5 py-1 rounded-xl bg-amber-500/12 border border-amber-500/30 text-amber-400 font-semibold">
 {stats.hotspots} hot resource{stats.hotspots > 1 ? 's' : ''}
 </span>
 )}
 </div>
 </div>

 {/* Stats bar */}
 <div className="grid grid-cols-5 gap-2">
 {[
 { label: 'Nodes', value: stats.nodes, icon: Target, color: 'text-slate-500' },
 { label: 'Edges', value: stats.edges, icon: Link, color: 'text-slate-500' },
 { label: 'Waiters', value: stats.waiters, icon: Clock, color: 'text-amber-400' },
 { label: 'Chains', value: stats.chains, icon: Zap, color: stats.chains > 0 ? 'text-amber-400' : 'text-slate-600' },
 { label: 'Cycles', value: stats.cycles, icon: AlertTriangle, color: stats.cycles > 0 ? 'text-red-400' : 'text-slate-600' },
 ].map(s => {
 const I = s.icon;
 return (
 <div key={s.label} className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-200/30 text-center">
 <I className={`h-3.5 w-3.5 mx-auto mb-1 ${s.color}`} />
 <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
 <p className="text-[9px] text-slate-600">{s.label}</p>
 </div>
 );
 })}
 </div>

 {/* Cycle alert */}
 {DEMO_CYCLES.map(cycle => (
 <div key={cycle.id} className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
 <div className="flex items-center gap-2 mb-1.5">
 <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
 <span className="text-xs font-bold text-red-300">{cycle.severity}: {cycle.description}</span>
 </div>
 <div className="flex items-center gap-1 flex-wrap">
 {cycle.pathLabels.map((label, i) => (
 <span key={i} className="flex items-center gap-1">
 <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{label}</span>
 {i < cycle.pathLabels.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-red-600" />}
 </span>
 ))}
 </div>
 <p className="text-[9px] text-slate-500 mt-1.5">
 Involved resources: {cycle.involvedResources.join(', ') || 'none'}.
 Resolve by aborting the lowest-utility entry in the cycle or waiting for signal timeout.
 </p>
 </div>
 ))}

 {/* Tabs */}
 <div className="flex gap-1 bg-slate-50/50 rounded-xl p-1 border border-slate-200/30">
 {(['ownership', 'chains', 'edges', 'confidence'] as const).map(t => (
 <button key={t} onClick={() => setTab(t)}
 className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition capitalize ${tab === t ? 'bg-slate-700/70 text-slate-700' : 'text-slate-500 hover:text-slate-500'}`}>
 {t === 'ownership' ? 'Resources' : t === 'chains' ? `Chains (${stats.chains})` : t === 'confidence' ? 'Plan Intelligence' : 'Edge List'}
 </button>
 ))}
 </div>

 {tab === 'ownership' && <ResourceOwnershipPanel ownership={DEMO_RESOURCE_OWN} />}
 {tab === 'chains' && <WaitChainPanel chains={DEMO_LONG_CHAINS} nodeMap={nodeMap} />}
 {tab === 'edges' && <EdgeListPanel edges={DEMO_EDGES} nodeMap={nodeMap} />}
 {tab === 'confidence' && <ConfidencePanel records={DEMO_CONFIDENCE} />}

 {/* Footer */}
 <div className="flex items-start gap-2 text-[10px] text-slate-600">
 <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-700" />
 <span>
 Cycle detection uses DFS WHITE/GRAY/BLACK coloring (O(V+E)). Long chains ≥ 3 hops signal livelock risk.
 Contention score = waiters × (avg wait / 5 min tick). Plan intelligence requires ≥ 3 executions to set recommended=true.
 </span>
 </div>
 </div>
 );
}
