'use client';
import { useState, useMemo } from 'react';
import {
 AlertTriangle, Zap, Database, Inbox, GitBranch, Shield,
 ChevronRight, ChevronLeft, Search, CornerDownLeft,
 Info, Layers, Link2,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────────────────── */ type GraphNodeType = 'INCIDENT' | 'MITIGATION' | 'PROJECTION' | 'QUEUE_JOB' | 'DOMAIN_EVENT' | 'REVISION';
type GraphEdgeRelation = 'CAUSED' | 'TRIGGERED' | 'RESOLVED' | 'ROLLED_BACK' | 'PROJECTED' | 'ENQUEUED' | 'CORRELATED';
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

interface GraphNode {
 id: string; type: GraphNodeType; label: string; timestamp: string;
 severity?: Severity; sloId?: string; tenantId?: string; correlationId?: string;
 metadata: Record<string, unknown>;
}

interface GraphEdge {
 from: string; to: string; relation: GraphEdgeRelation;
 timestamp: string; confidence: number;
}

/* ── Demo Data ───────────────────────────────────────────────────────────────── */ const NODES: GraphNode[] = [
 { id: 'n1', type: 'DOMAIN_EVENT', label: 'PayrollBatchDispatched — PayrollBatch', timestamp: new Date(Date.now() - 58 * 60000).toISOString(), severity: 'INFO', metadata: { aggregate: 'PayrollBatch' } },
 { id: 'n2', type: 'QUEUE_JOB', label: 'process-payroll failed after 3 retries (Connection TMO)', timestamp: new Date(Date.now() - 55 * 60000).toISOString(), severity: 'HIGH', metadata: { queue: 'payroll-jobs', retries: 3 } },
 { id: 'n3', type: 'INCIDENT', label: 'SLO breach: payroll-job-success-rate (32% above thresh)', timestamp: new Date(Date.now() - 50 * 60000).toISOString(), severity: 'HIGH', sloId: 'payroll-job-success-rate', metadata: {} },
 { id: 'n4', type: 'INCIDENT', label: 'SLO breach: dlq-spike (78.6% above threshold)', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), severity: 'CRITICAL', sloId: 'dlq-spike', metadata: {} },
 { id: 'n5', type: 'PROJECTION', label: 'Projection stale: payroll domain, lag=245s', timestamp: new Date(Date.now() - 42 * 60000).toISOString(), severity: 'HIGH', metadata: { domain: 'payroll', lag: 245 } },
 { id: 'n6', type: 'MITIGATION', label: 'PROPOSED: drain_dlq on queue:all', timestamp: new Date(Date.now() - 40 * 60000).toISOString(), severity: 'INFO', sloId: 'dlq-spike', metadata: { action: 'drain_dlq' } },
 { id: 'n7', type: 'MITIGATION', label: 'EXECUTED: drain_dlq on queue:all (operator)', timestamp: new Date(Date.now() - 37 * 60000).toISOString(), severity: 'HIGH', sloId: 'dlq-spike', metadata: { action: 'drain_dlq', actor: 'operator' } },
 { id: 'n8', type: 'MITIGATION', label: 'RESOLVED: drain_dlq on queue:all — SLO recovered', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), severity: 'INFO', sloId: 'dlq-spike', metadata: {} },
 { id: 'n9', type: 'INCIDENT', label: 'SLO recovery: dlq-spike value=2 returned to passing', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), severity: 'INFO', sloId: 'dlq-spike', metadata: {} },
 { id: 'n10', type: 'INCIDENT', label: 'SLO recovery: payroll-job-success-rate passing', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), severity: 'INFO', sloId: 'payroll-job-success-rate', metadata: {} },
];

const EDGES: GraphEdge[] = [
 { from: 'n1', to: 'n2', relation: 'ENQUEUED', timestamp: NODES[1].timestamp, confidence: 1.0 },
 { from: 'n2', to: 'n3', relation: 'CAUSED', timestamp: NODES[2].timestamp, confidence: 0.9 },
 { from: 'n2', to: 'n4', relation: 'CAUSED', timestamp: NODES[3].timestamp, confidence: 0.8 },
 { from: 'n3', to: 'n5', relation: 'TRIGGERED', timestamp: NODES[4].timestamp, confidence: 0.7 },
 { from: 'n4', to: 'n6', relation: 'TRIGGERED', timestamp: NODES[5].timestamp, confidence: 1.0 },
 { from: 'n6', to: 'n7', relation: 'CAUSED', timestamp: NODES[6].timestamp, confidence: 1.0 },
 { from: 'n7', to: 'n9', relation: 'RESOLVED', timestamp: NODES[8].timestamp, confidence: 0.9 },
 { from: 'n9', to: 'n8', relation: 'RESOLVED', timestamp: NODES[7].timestamp, confidence: 1.0 },
 { from: 'n7', to: 'n10', relation: 'TRIGGERED', timestamp: NODES[9].timestamp, confidence: 0.6 },
];

/* ── Styling ─────────────────────────────────────────────────────────────────── */ const NODE_STYLE: Record<GraphNodeType, { icon: any; color: string; bg: string; border: string }> = {
 INCIDENT: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/40' },
 MITIGATION: { icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/40' },
 PROJECTION: { icon: Database, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40' },
 QUEUE_JOB: { icon: Inbox, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40' },
 DOMAIN_EVENT: { icon: GitBranch, color: 'text-slate-500', bg: 'bg-slate-700/40', border: 'border-slate-600/40' },
 REVISION: { icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40' },
};

const EDGE_STYLE: Record<GraphEdgeRelation, { label: string; color: string }> = {
 CAUSED: { label: 'Caused', color: 'text-red-400' },
 TRIGGERED: { label: 'Triggered', color: 'text-amber-400' },
 RESOLVED: { label: 'Resolved', color: 'text-emerald-400' },
 ROLLED_BACK: { label: 'Rolled back', color: 'text-red-400' },
 PROJECTED: { label: 'Projected', color: 'text-blue-400' },
 ENQUEUED: { label: 'Enqueued', color: 'text-slate-500' },
 CORRELATED: { label: 'Correlated', color: 'text-slate-500' },
};

const SEV_DOT: Record<Severity, string> = {
 CRITICAL: 'bg-red-500', HIGH: 'bg-orange-500', MEDIUM: 'bg-amber-400',
 LOW: 'bg-blue-500', INFO: 'bg-slate-500',
};

function relTime(iso: string) {
 const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
 return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${(m / 60).toFixed(1)}h ago`;
}

/* ── Component ───────────────────────────────────────────────────────────────── */ type TraversalMode = 'none' | 'rootcause' | 'blastradius';

export function KnowledgeGraphView() {
 const [selected, setSelected] = useState<string | null>(null);
 const [traversal, setTraversal] = useState<TraversalMode>('none');
 const [filterType, setFilterType] = useState<GraphNodeType | 'ALL'>('ALL');
 const [search, setSearch] = useState('');

 /* Build adjacency maps */ const fwdMap = useMemo(() => {
 const m = new Map<string, string[]>();
 for (const e of EDGES) {
 if (!m.has(e.from)) m.set(e.from, []);
 m.get(e.from)!.push(e.to);
 }
 return m;
 }, []);

 const bwdMap = useMemo(() => {
 const m = new Map<string, string[]>();
 for (const e of EDGES) {
 if (!m.has(e.to)) m.set(e.to, []);
 m.get(e.to)!.push(e.from);
 }
 return m;
 }, []);

 /* BFS traversal */ const traversalNodes = useMemo((): Set<string> => {
 if (!selected || traversal === 'none') return new Set();
 const visited = new Set<string>();
 const queue = [selected];
 const map = traversal === 'rootcause' ? bwdMap : fwdMap;
 while (queue.length > 0) {
 const id = queue.shift()!;
 if (visited.has(id)) continue;
 visited.add(id);
 for (const n of map.get(id) ?? []) { if (!visited.has(n)) queue.push(n); }
 }
 return visited;
 }, [selected, traversal, fwdMap, bwdMap]);

 const selectedNode = selected ? NODES.find(n => n.id === selected) : null;
 const selectedEdgesOut = selected ? EDGES.filter(e => e.from === selected) : [];
 const selectedEdgesIn = selected ? EDGES.filter(e => e.to === selected) : [];

 const visibleNodes = NODES.filter(n =>
 (filterType === 'ALL' || n.type === filterType) &&
 (!search || n.label.toLowerCase().includes(search.toLowerCase())),
 );

 const stats = {
 nodes: NODES.length, edges: EDGES.length,
 byType: Object.fromEntries(
 (['INCIDENT', 'MITIGATION', 'PROJECTION', 'QUEUE_JOB', 'DOMAIN_EVENT'] as GraphNodeType[])
 .map(t => [t, NODES.filter(n => n.type === t).length]),
 ),
 };

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-start justify-between flex-wrap gap-3">
 <div>
 <h1 className="text-xl font-bold text-slate-100">Operational Knowledge Graph</h1>
 <p className="text-xs text-slate-500 mt-0.5">Causal relationships across incidents, mitigations, projections, queues, and domain events</p>
 </div>
 <div className="flex items-center gap-2 flex-wrap text-[10px]">
 {Object.entries(stats.byType).map(([type, count]) => {
 const s = NODE_STYLE[type as GraphNodeType];
 const I = s.icon;
 return count > 0 ? (
 <span key={type} className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${s.bg} ${s.border} ${s.color} font-semibold`}>
 <I className="h-2.5 w-2.5" /> {count}
 </span>
 ) : null;
 })}
 <span className="px-2 py-1 rounded-lg bg-slate-50/60 border border-slate-200/40 text-slate-500">
 {stats.edges} edges
 </span>
 </div>
 </div>

 {/* Controls */}
 <div className="flex items-center gap-2 flex-wrap">
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
 <input value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Search nodes…"
 className="pl-7 pr-3 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200/40 text-xs text-slate-700 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 w-44" />
 </div>
 {(['ALL', 'INCIDENT', 'MITIGATION', 'PROJECTION', 'QUEUE_JOB', 'DOMAIN_EVENT'] as const).map(t => (
 <button key={t} onClick={() => setFilterType(t)}
 className={`px-2.5 py-1.5 rounded-xl text-[10px] font-semibold capitalize transition ${filterType === t ? 'bg-indigo-600 text-white' : 'bg-slate-50/60 text-slate-500 hover:text-slate-700'}`}>
 {t === 'ALL' ? 'All' : t.replace('_', ' ')}
 </button>
 ))}
 </div>

 <div className="flex gap-3">
 {/* Node list */}
 <div className="flex-1 space-y-1.5 min-w-0">
 {visibleNodes.map((node, idx) => {
 const s = NODE_STYLE[node.type];
 const Icon = s.icon;
 const isSelected = node.id === selected;
 const isTraversed = traversalNodes.has(node.id) && traversal !== 'none';

 /* Edges for this node */ const outEdges = EDGES.filter(e => e.from === node.id);
 const inEdges = EDGES.filter(e => e.to === node.id);

 return (
 <div key={node.id}
 onClick={() => setSelected(isSelected ? null : node.id)}
 className={`relative flex items-start gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
 isSelected ? `${s.bg} ${s.border} ring-1 ring-indigo-500/40` :
 isTraversed ? 'bg-indigo-500/8 border-indigo-500/25' :
 'bg-slate-50/40 border-slate-200/30 hover:border-slate-600/50'
 }`}>
 {/* Spine */}
 {idx < visibleNodes.length - 1 && (
 <div className="absolute left-5 top-8 w-px h-full bg-slate-700/30" />
 )}
 {/* Icon */}
 <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 border ${s.bg} ${s.border}`}>
 <Icon className={`h-3 w-3 ${s.color}`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 {node.severity && <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${SEV_DOT[node.severity]}`} />}
 <span className="text-xs font-semibold text-slate-700 truncate">{node.label}</span>
 <span className="ml-auto text-[10px] text-slate-500 flex-shrink-0">{relTime(node.timestamp)}</span>
 </div>
 <div className="flex items-center gap-3 mt-0.5">
 <span className={`text-[9px] font-bold ${s.color}`}>{node.type.replace('_', ' ')}</span>
 {node.sloId && <span className="text-[9px] text-slate-600 font-mono">{node.sloId}</span>}
 {outEdges.length > 0 && <span className="text-[9px] text-slate-600">→ {outEdges.length} edge{outEdges.length > 1 ? 's' : ''}</span>}
 {inEdges.length > 0 && <span className="text-[9px] text-slate-600">{inEdges.length} incoming</span>}
 </div>
 </div>
 <ChevronRight className={`h-3.5 w-3.5 text-slate-600 mt-1.5 flex-shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
 </div>
 );
 })}
 </div>

 {/* Detail panel */}
 {selectedNode && (
 <div className="w-64 flex-shrink-0 space-y-3">
 {/* Node detail */}
 <div className={`p-3 rounded-2xl border ${NODE_STYLE[selectedNode.type].bg} ${NODE_STYLE[selectedNode.type].border} space-y-2`}>
 <div className="flex items-center gap-2">
 {(() => { const I = NODE_STYLE[selectedNode.type].icon; return <I className={`h-3.5 w-3.5 ${NODE_STYLE[selectedNode.type].color}`} />; })()}
 <span className={`text-[10px] font-bold ${NODE_STYLE[selectedNode.type].color}`}>{selectedNode.type.replace('_', ' ')}</span>
 </div>
 <p className="text-xs text-slate-700 font-semibold leading-snug">{selectedNode.label}</p>
 <p className="text-[10px] text-slate-500">{relTime(selectedNode.timestamp)}</p>
 </div>

 {/* Traversal controls */}
 <div className="flex gap-2">
 <button onClick={() => setTraversal(traversal === 'rootcause' ? 'none' : 'rootcause')}
 className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-semibold border transition ${traversal === 'rootcause' ? 'bg-red-600/30 border-red-500/40 text-red-300' : 'bg-slate-50/60 border-slate-200/40 text-slate-500'}`}>
 <ChevronLeft className="h-3 w-3" /> Root Causes
 </button>
 <button onClick={() => setTraversal(traversal === 'blastradius' ? 'none' : 'blastradius')}
 className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-semibold border transition ${traversal === 'blastradius' ? 'bg-orange-600/30 border-orange-500/40 text-orange-300' : 'bg-slate-50/60 border-slate-200/40 text-slate-500'}`}>
 Blast Radius <ChevronRight className="h-3 w-3" />
 </button>
 </div>

 {/* Outgoing edges */}
 {selectedEdgesOut.length > 0 && (
 <div className="p-3 rounded-xl bg-slate-50/40 border border-slate-200/30 space-y-1.5">
 <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Caused / Triggered</p>
 {selectedEdgesOut.map(e => {
 const target = NODES.find(n => n.id === e.to);
 const es = EDGE_STYLE[e.relation];
 if (!target) return null;
 const TS = NODE_STYLE[target.type];
 const TI = TS.icon;
 return (
 <div key={e.to} className="flex items-start gap-1.5 cursor-pointer" onClick={ev => { ev.stopPropagation(); setSelected(e.to); }}>
 <TI className={`h-3 w-3 mt-0.5 flex-shrink-0 ${TS.color}`} />
 <div className="flex-1 min-w-0">
 <span className={`text-[9px] font-bold ${es.color}`}>{es.label}</span>
 <p className="text-[10px] text-slate-500 truncate">{target.label.slice(0, 55)}</p>
 <span className="text-[9px] text-slate-600">conf {Math.round(e.confidence * 100)}%</span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Incoming edges */}
 {selectedEdgesIn.length > 0 && (
 <div className="p-3 rounded-xl bg-slate-50/40 border border-slate-200/30 space-y-1.5">
 <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Caused By</p>
 {selectedEdgesIn.map(e => {
 const source = NODES.find(n => n.id === e.from);
 const es = EDGE_STYLE[e.relation];
 if (!source) return null;
 const SS = NODE_STYLE[source.type];
 const SI = SS.icon;
 return (
 <div key={e.from} className="flex items-start gap-1.5 cursor-pointer" onClick={ev => { ev.stopPropagation(); setSelected(e.from); }}>
 <SI className={`h-3 w-3 mt-0.5 flex-shrink-0 ${SS.color}`} />
 <div className="flex-1 min-w-0">
 <span className={`text-[9px] font-bold ${es.color}`}>{es.label}</span>
 <p className="text-[10px] text-slate-500 truncate">{source.label.slice(0, 55)}</p>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Graph stats */}
 {traversalNodes.size > 0 && (
 <div className={`p-2.5 rounded-xl border text-center ${traversal === 'rootcause' ? 'bg-red-500/10 border-red-500/25' : 'bg-orange-500/10 border-orange-500/25'}`}>
 <p className="text-[10px] text-slate-500">
 {traversal === 'rootcause' ? '← Root cause' : 'Blast radius →'} traversal:&nbsp;
 <span className={`font-bold ${traversal === 'rootcause' ? 'text-red-400' : 'text-orange-400'}`}>
 {traversalNodes.size} node{traversalNodes.size !== 1 ? 's' : ''}
 </span>
 </p>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Legend */}
 <div className="p-3 rounded-xl bg-slate-50/30 border border-slate-200/30 grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-1.5">
 {(Object.entries(NODE_STYLE) as [GraphNodeType, typeof NODE_STYLE[GraphNodeType]][]).map(([type, s]) => {
 const I = s.icon;
 return (
 <span key={type} className="flex items-center gap-1.5 text-[10px] text-slate-500">
 <I className={`h-2.5 w-2.5 ${s.color}`} />
 <span>{type.replace('_', ' ')}</span>
 </span>
 );
 })}
 </div>
 </div>
 );
}
