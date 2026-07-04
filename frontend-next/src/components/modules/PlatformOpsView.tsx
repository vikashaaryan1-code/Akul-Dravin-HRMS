'use client';

import { useState, useEffect, useCallback } from 'react';
import {
 Activity, AlertTriangle, CheckCircle, Clock, RefreshCw,
 Search, RotateCcw, XCircle, ChevronRight, Layers, Zap,
 Database, BarChart2, Shield,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */ interface QueueRow { name: string; dlqDepth: number; hasAlert: boolean }
interface DlqEntry {
 id: string; queue_name: string; job_name: string; tenant_id: string;
 error_message: string; attempts: number; last_failed_at: string;
 idempotency_key: string; replayed_at: string | null;
}
interface ProjectionRow {
 domain: string; isStale: boolean; projectionVersion: number;
 staleReason: string | null; lastRebuiltAt: string | null; lagSeconds: number;
}
interface TraceEvent {
 id: string; type: string; source: string; message: string; ts: string; correlationId?: string;
}

type Panel = 'queues' | 'dlq' | 'projections' | 'tracer' | 'worker';

/* ─── Mock data (replaced by API calls in production) ───────────────────────── */ const MOCK_QUEUES: QueueRow[] = [
 { name: 'ai-jobs', dlqDepth: 2, hasAlert: true },
 { name: 'analytics', dlqDepth: 0, hasAlert: false },
 { name: 'payroll', dlqDepth: 0, hasAlert: false },
 { name: 'notifications', dlqDepth: 1, hasAlert: true },
 { name: 'governance', dlqDepth: 0, hasAlert: false },
];
const MOCK_DLQ: DlqEntry[] = [
 { id: 'dlq-1', queue_name: 'ai-jobs', job_name: 'attrition-scan', tenant_id: 'tenant-abc', error_message: 'Connection timeout to AI provider', attempts: 3, last_failed_at: '2026-05-14T07:41:00Z', idempotency_key: 'ai:attrition:tenant-abc:2026-05', replayed_at: null },
 { id: 'dlq-2', queue_name: 'notifications', job_name: 'send', tenant_id: 'tenant-xyz', error_message: 'SMTP authentication failed', attempts: 3, last_failed_at: '2026-05-14T06:12:00Z', idempotency_key: 'notify:send:emp-007:onboard', replayed_at: null },
];
const MOCK_PROJECTIONS: ProjectionRow[] = [
 { domain: 'workforce', isStale: true, projectionVersion: 3, staleReason: 'employee.created:emp-991', lastRebuiltAt: '2026-05-14T06:00:00Z', lagSeconds: 420 },
 { domain: 'recruitment', isStale: false, projectionVersion: 2, staleReason: null, lastRebuiltAt: '2026-05-14T08:01:00Z', lagSeconds: 12 },
 { domain: 'revenue', isStale: false, projectionVersion: 1, staleReason: null, lastRebuiltAt: '2026-05-14T07:50:00Z', lagSeconds: 0 },
];
const MOCK_TRACE: TraceEvent[] = [
 { id: 't1', type: 'HTTP_REQUEST', source: 'API Gateway', message: 'POST /employees → 201', correlationId: 'cid-4f8a', ts: '08:31:00.011' },
 { id: 't2', type: 'DOMAIN_EVENT', source: 'EmployeeModule', message: 'employee.created emitted', correlationId: 'cid-4f8a', ts: '08:31:00.044' },
 { id: 't3', type: 'PROJECTION', source: 'AnalyticsProjection',message: 'Cache busted: workforce', correlationId: 'cid-4f8a', ts: '08:31:00.046' },
 { id: 't4', type: 'QUEUE_JOB', source: 'analytics queue', message: 'kpi-snapshot enqueued (5s debounce)', correlationId: 'cid-4f8a', ts: '08:31:00.047' },
 { id: 't5', type: 'REVISION', source: 'RevisionEngine', message: 'Employee/emp-991 revision:1 captured', correlationId: 'cid-4f8a', ts: '08:31:00.052' },
 { id: 't6', type: 'QUEUE_PROCESSED', source: 'AnalyticsProcessor', message: 'kpi-snapshot completed (38ms)', correlationId: 'cid-4f8a', ts: '08:31:05.089' },
];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */ const fmtLag = (s: number) => s > 60 ? `${Math.round(s / 60)}m ${s % 60}s` : `${s}s`;
const fmtDate = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour12: false });

const EVENT_COLORS: Record<string, string> = {
 HTTP_REQUEST: 'text-sky-400',
 DOMAIN_EVENT: 'text-violet-400',
 PROJECTION: 'text-amber-400',
 QUEUE_JOB: 'text-indigo-400',
 REVISION: 'text-emerald-400',
 QUEUE_PROCESSED: 'text-teal-400',
};

/* ─── Component ──────────────────────────────────────────────────────────────── */ export function PlatformOpsView() {
 const [panel, setPanel] = useState<Panel>('queues');
 const [queues, setQueues] = useState<QueueRow[]>(MOCK_QUEUES);
 const [dlqEntries, setDlqEntries] = useState<DlqEntry[]>(MOCK_DLQ);
 const [projections, setProjections] = useState<ProjectionRow[]>(MOCK_PROJECTIONS);
 const [traceSearch, setTraceSearch] = useState('cid-4f8a');
 const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
 const [refreshing, setRefreshing] = useState(false);

 const totalAlerts = queues.reduce((s, q) => s + q.dlqDepth, 0);

 const refresh = useCallback(async () => {
 setRefreshing(true);
 // In production: fetch from /admin/dlq/snapshot, /admin/projections, etc.
 await new Promise(r => setTimeout(r, 800));
 setRefreshing(false);
 }, []);

 const handleTrace = () => {
 if (traceSearch.trim()) setTraceEvents(MOCK_TRACE);
 };

 const handleReplay = (id: string) => {
 setDlqEntries(prev => prev.map(e => e.id === id ? { ...e, replayed_at: new Date().toISOString() } : e));
 };

 const handleDismiss = (id: string) => {
 setDlqEntries(prev => prev.filter(e => e.id !== id));
 };

 const PANELS: { id: Panel; label: string; icon: React.ReactNode; badge?: number }[] = [
 { id: 'queues', label: 'Queue Monitor', icon: <Activity className="h-4 w-4" />, badge: totalAlerts > 0 ? totalAlerts : undefined },
 { id: 'dlq', label: 'DLQ Manager', icon: <AlertTriangle className="h-4 w-4" />, badge: dlqEntries.filter(e => !e.replayed_at).length || undefined },
 { id: 'projections', label: 'Projection Health', icon: <Layers className="h-4 w-4" />, badge: projections.filter(p => p.isStale).length || undefined },
 { id: 'tracer', label: 'Correlation Tracer', icon: <Search className="h-4 w-4" /> },
 { id: 'worker', label: 'Worker Health', icon: <Zap className="h-4 w-4" /> },
 ];

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-xl font-bold text-slate-100">Platform Operations</h1>
 <p className="text-xs text-slate-500 mt-0.5">Distributed queue health · projection state · correlation tracing</p>
 </div>
 <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-700 text-xs transition">
 <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
 </button>
 </div>

 {/* Panel tabs */}
 <div className="flex gap-2 flex-wrap">
 {PANELS.map(p => (
 <button key={p.id} onClick={() => setPanel(p.id)}
 className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${panel === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-50/70 text-slate-500 hover:text-slate-700'}`}>
 {p.icon}{p.label}
 {p.badge !== undefined && (
 <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">{p.badge}</span>
 )}
 </button>
 ))}
 </div>

 {/* ── Queue Monitor ─────────────────────────────────────────────────── */}
 {panel === 'queues' && (
 <div className="space-y-3">
 <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
 {queues.map(q => (
 <div key={q.name} className={`p-4 rounded-2xl border ${q.hasAlert ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-50/60 border-slate-200/50'}`}>
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{q.name}</span>
 {q.hasAlert ? <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
 </div>
 <p className={`text-2xl font-bold ${q.hasAlert ? 'text-red-300' : 'text-slate-700'}`}>{q.dlqDepth}</p>
 <p className="text-[10px] text-slate-500 mt-0.5">DLQ entries</p>
 </div>
 ))}
 </div>

 {/* Worker concurrency summary */}
 <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/50">
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Worker Concurrency Config</p>
 <div className="grid grid-cols-5 gap-2">
 {[
 { queue: 'ai-jobs', concurrency: 3, color: 'bg-violet-600' },
 { queue: 'analytics', concurrency: 5, color: 'bg-sky-600' },
 { queue: 'payroll', concurrency: 1, color: 'bg-amber-600' },
 { queue: 'notifications', concurrency: 10, color: 'bg-emerald-600' },
 { queue: 'governance', concurrency: 3, color: 'bg-indigo-600' },
 ].map(w => (
 <div key={w.queue} className="text-center">
 <div className={`h-2 rounded-full ${w.color} mb-1`} style={{ width: `${(w.concurrency / 10) * 100}%`, minWidth: 8 }} />
 <p className="text-xs font-bold text-slate-700">{w.concurrency}</p>
 <p className="text-[9px] text-slate-500">{w.queue.replace('-jobs','')}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* ── DLQ Manager ──────────────────────────────────────────────────── */}
 {panel === 'dlq' && (
 <div className="space-y-3">
 {dlqEntries.filter(e => !e.replayed_at).length === 0 && (
 <div className="flex flex-col items-center justify-center py-16 text-slate-500">
 <CheckCircle className="h-10 w-10 mb-3 text-emerald-500" />
 <p className="font-semibold text-slate-600">All queues healthy</p>
 <p className="text-xs mt-1">No unresolved dead letters</p>
 </div>
 )}
 {dlqEntries.filter(e => !e.replayed_at).map(e => (
 <div key={e.id} className="p-4 rounded-2xl bg-slate-50/70 border border-red-500/20 space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-300 text-[10px] font-bold uppercase">{e.queue_name}</span>
 <span className="text-xs font-semibold text-slate-700">{e.job_name}</span>
 </div>
 <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDate(e.last_failed_at)}</span>
 </div>
 <p className="text-xs text-red-300 font-mono bg-red-500/10 px-3 py-1.5 rounded-lg">{e.error_message}</p>
 <div className="flex items-center justify-between text-[10px] text-slate-500">
 <span>Attempts: <span className="text-slate-600 font-bold">{e.attempts}</span></span>
 <span className="font-mono truncate max-w-[200px]">{e.idempotency_key}</span>
 </div>
 <div className="flex gap-2 pt-1">
 <button onClick={() => handleReplay(e.id)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition">
 <RotateCcw className="h-3 w-3" /> Replay
 </button>
 <button onClick={() => handleDismiss(e.id)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-600 text-xs font-semibold transition">
 <XCircle className="h-3 w-3" /> Dismiss
 </button>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* ── Projection Health ─────────────────────────────────────────────── */}
 {panel === 'projections' && (
 <div className="space-y-3">
 {projections.map(p => (
 <div key={p.domain} className={`p-4 rounded-2xl border ${p.isStale ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50/60 border-slate-200/50'}`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <BarChart2 className={`h-5 w-5 ${p.isStale ? 'text-amber-400' : 'text-emerald-400'}`} />
 <div>
 <p className="text-sm font-bold text-slate-700 capitalize">{p.domain}</p>
 <p className="text-[10px] text-slate-500">Schema v{p.projectionVersion}</p>
 </div>
 </div>
 <div className="text-right">
 <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${p.isStale ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
 {p.isStale ? 'STALE' : 'HEALTHY'}
 </span>
 <p className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-end gap-1">
 <Clock className="h-3 w-3" /> lag: {fmtLag(p.lagSeconds)}
 </p>
 </div>
 </div>
 {p.isStale && p.staleReason && (
 <p className="mt-2 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded-lg">
 cause: {p.staleReason}
 </p>
 )}
 {p.lastRebuiltAt && (
 <p className="mt-1 text-[10px] text-slate-500">Last rebuilt: {fmtDate(p.lastRebuiltAt)}</p>
 )}
 </div>
 ))}
 </div>
 )}

 {/* ── Correlation Tracer ────────────────────────────────────────────── */}
 {panel === 'tracer' && (
 <div className="space-y-4">
 <div className="flex gap-2">
 <input value={traceSearch} onChange={e => setTraceSearch(e.target.value)}
 placeholder="Enter correlationId (e.g. cid-4f8a)"
 className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
 <button onClick={handleTrace}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition">
 <Search className="h-3.5 w-3.5" /> Trace
 </button>
 </div>

 {traceEvents.length > 0 && (
 <div className="relative space-y-0">
 <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-700/60" />
 {traceEvents.map((ev, i) => (
 <div key={ev.id} className="relative flex items-start gap-3 pl-10 pb-3">
 <div className="absolute left-[10px] top-1.5 h-4 w-4 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center">
 <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
 </div>
 <div className="flex-1 bg-slate-50/60 border border-slate-200/50 rounded-xl px-3 py-2">
 <div className="flex items-center justify-between mb-0.5">
 <span className={`text-[9px] font-bold uppercase tracking-wider ${EVENT_COLORS[ev.type] ?? 'text-slate-500'}`}>{ev.type.replace(/_/g,' ')}</span>
 <span className="text-[9px] text-slate-500 font-mono">{ev.ts}</span>
 </div>
 <p className="text-xs text-slate-600">{ev.message}</p>
 <p className="text-[9px] text-slate-500 mt-0.5">{ev.source}</p>
 </div>
 </div>
 ))}
 </div>
 )}
 {traceEvents.length === 0 && (
 <div className="flex flex-col items-center py-12 text-slate-600">
 <Search className="h-8 w-8 mb-2" />
 <p className="text-sm">Enter a correlationId to trace the full event chain</p>
 </div>
 )}
 </div>
 )}

 {/* ── Worker Health ─────────────────────────────────────────────────── */}
 {panel === 'worker' && (
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
 {[
 { name: 'AI Processor', queue: 'ai-jobs', concurrency: 3, status: 'running', lastSuccess: '08:31:05', lastError: '07:41:00', jobsToday: 142 },
 { name: 'Analytics Processor', queue: 'analytics', concurrency: 5, status: 'running', lastSuccess: '08:31:05', lastError: null, jobsToday: 918 },
 { name: 'Payroll Processor', queue: 'payroll', concurrency: 1, status: 'idle', lastSuccess: '06:00:00', lastError: null, jobsToday: 4 },
 { name: 'Notification Processor', queue: 'notifications', concurrency: 10, status: 'running', lastSuccess: '08:30:55', lastError: '06:12:00', jobsToday: 3042 },
 { name: 'Governance Processor', queue: 'governance', concurrency: 3, status: 'running', lastSuccess: '08:31:01', lastError: null, jobsToday: 287 },
 ].map(w => (
 <div key={w.name} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/50 space-y-3">
 <div className="flex items-center justify-between">
 <p className="text-sm font-bold text-slate-700">{w.name}</p>
 <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${w.status === 'running' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-500'}`}>
 {w.status.toUpperCase()}
 </span>
 </div>
 <div className="space-y-1.5 text-[11px]">
 <div className="flex justify-between"><span className="text-slate-500">Concurrency</span><span className="text-slate-600 font-bold">{w.concurrency}</span></div>
 <div className="flex justify-between"><span className="text-slate-500">Jobs today</span><span className="text-slate-600 font-bold">{w.jobsToday.toLocaleString()}</span></div>
 <div className="flex justify-between"><span className="text-slate-500">Last success</span><span className="text-emerald-400 font-mono">{w.lastSuccess}</span></div>
 {w.lastError && <div className="flex justify-between"><span className="text-slate-500">Last error</span><span className="text-red-400 font-mono">{w.lastError}</span></div>}
 </div>
 {/* Throughput bar */}
 <div className="h-1.5 rounded-full bg-slate-700">
 <div className="h-1.5 rounded-full bg-indigo-500"
 style={{ width: `${Math.min((w.jobsToday / 3042) * 100, 100)}%` }} />
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
