'use client';
import { useState } from 'react';
import {
  AlertTriangle, Shield, Database, Inbox, GitBranch, Layers,
  ChevronDown, ChevronUp, Link2, BarChart2, Search, Zap, Activity,
  CheckCircle, Info,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type GraphNodeType = 'INCIDENT' | 'MITIGATION' | 'PROJECTION' | 'QUEUE_JOB' | 'DOMAIN_EVENT' | 'REVISION';

interface GraphNode {
  id: string; type: GraphNodeType; label: string; timestamp: string;
  severity?: string; sloId?: string; metadata: Record<string, unknown>;
}

interface RcaSuggestion {
  node:           GraphNode;
  score:          number;
  repeatCount:    number;
  depth:          number;
  rationale:      string;
  edgeConfidence: number;
}

interface RcaReport {
  incidentNodeId:  string;
  incidentLabel:   string;
  suggestions:     RcaSuggestion[];
  analysisDepth:   number;
  totalCandidates: number;
  analysisMs:      number;
  generatedAt:     string;
}

// ── Demo Data ─────────────────────────────────────────────────────────────────

const DEMO_REPORTS: RcaReport[] = [
  {
    incidentNodeId: 'n4',
    incidentLabel:  'SLO breach: dlq-spike (78.6% above threshold)',
    analysisDepth:  6, totalCandidates: 4, analysisMs: 12,
    generatedAt:    new Date(Date.now() - 20 * 60000).toISOString(),
    suggestions: [
      {
        node: { id: 'n2', type: 'QUEUE_JOB', label: 'process-payroll failed after 3 retries (Connection TMO)', timestamp: new Date(Date.now() - 55 * 60000).toISOString(), severity: 'HIGH', metadata: { queue: 'payroll-jobs', retries: 3 } },
        score: 0.891, depth: 2, repeatCount: 3, edgeConfidence: 0.8,
        rationale: 'QUEUE JOB node at depth 2 (2 hops back) · strong causal link (correlationId chain) · occurred 10m before incident',
      },
      {
        node: { id: 'n1', type: 'DOMAIN_EVENT', label: 'PayrollBatchDispatched — PayrollBatch (batch_id=PAY-2024-05)', timestamp: new Date(Date.now() - 58 * 60000).toISOString(), severity: undefined, metadata: { aggregate: 'PayrollBatch' } },
        score: 0.762, depth: 3, repeatCount: 1, edgeConfidence: 1.0,
        rationale: 'DOMAIN EVENT node at depth 3 · deterministic causal link (causationId-backed) · occurred 13m before incident',
      },
      {
        node: { id: 'n3', type: 'INCIDENT', label: 'SLO breach: payroll-job-success-rate (32% above threshold)', timestamp: new Date(Date.now() - 50 * 60000).toISOString(), severity: 'HIGH', sloId: 'payroll-job-success-rate', metadata: {} },
        score: 0.618, depth: 1, repeatCount: 0, edgeConfidence: 0.8,
        rationale: 'INCIDENT node at depth 1 (direct parent) · strong causal link · occurred 5m before incident',
      },
      {
        node: { id: 'n5', type: 'PROJECTION', label: 'Projection stale: payroll domain, lag=245s', timestamp: new Date(Date.now() - 42 * 60000).toISOString(), severity: 'HIGH', metadata: { lag: 245 } },
        score: 0.420, depth: 2, repeatCount: 2, edgeConfidence: 0.7,
        rationale: 'PROJECTION node at depth 2 · strong causal link · occurred 3m before incident · ⚠ low temporal proximity — verify',
      },
    ],
  },
];

// ── Styling ───────────────────────────────────────────────────────────────────

const NODE_STYLE: Record<GraphNodeType, { icon: any; color: string; bg: string }> = {
  INCIDENT:     { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/15' },
  MITIGATION:   { icon: Shield,        color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
  PROJECTION:   { icon: Database,      color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  QUEUE_JOB:    { icon: Inbox,         color: 'text-orange-400', bg: 'bg-orange-500/15' },
  DOMAIN_EVENT: { icon: GitBranch,     color: 'text-slate-400',  bg: 'bg-slate-700/40' },
  REVISION:     { icon: Layers,        color: 'text-cyan-400',   bg: 'bg-cyan-500/15' },
};

const CONF_LABEL = (c: number) => c >= 1.0 ? { text: 'Deterministic', color: 'text-emerald-400' } : c >= 0.7 ? { text: 'Strong', color: 'text-blue-400' } : { text: 'Inferred', color: 'text-slate-400' };

function ScoreBar({ score }: { score: number }) {
  const pct   = Math.round(score * 100);
  const color = pct >= 75 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : pct >= 30 ? 'bg-blue-500' : 'bg-slate-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-slate-700/60 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-300 w-9 text-right">{pct}%</span>
    </div>
  );
}

function relTime(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${m}m ago` : `${(m / 60).toFixed(1)}h ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RcaPanel() {
  const [activeReport, setActiveReport] = useState(0);
  const [expanded, setExpanded]         = useState<string | null>(null);
  const report                          = DEMO_REPORTS[activeReport];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Automated RCA Suggestions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Probable root causes ranked by causal confidence · temporal proximity · graph depth
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] flex-wrap">
          <span className="px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/40 text-slate-400">
            Depth {report.analysisDepth} · {report.totalCandidates} candidates · {report.analysisMs}ms
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/40 text-slate-500">
            {relTime(report.generatedAt)}
          </span>
        </div>
      </div>

      {/* Incident anchor */}
      <div className="p-3 rounded-xl bg-red-500/12 border border-red-500/30 flex items-center gap-2.5">
        <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
        <div>
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide">Incident Under Analysis</p>
          <p className="text-xs text-slate-200 font-semibold">{report.incidentLabel}</p>
        </div>
      </div>

      {/* RCA suggestions */}
      <div className="space-y-2">
        {report.suggestions.map((s, idx) => {
          const ns  = NODE_STYLE[s.node.type];
          const I   = ns.icon;
          const cl  = CONF_LABEL(s.edgeConfidence);
          const isOpen = expanded === s.node.id;

          return (
            <div key={s.node.id}
              className={`rounded-2xl border transition-all cursor-pointer ${isOpen ? 'bg-slate-800/70 border-slate-600/50' : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/40'}`}
              onClick={() => setExpanded(isOpen ? null : s.node.id)}>

              {/* Summary row */}
              <div className="flex items-start gap-3 p-3.5">
                {/* Rank badge */}
                <div className={`relative flex-shrink-0 w-8 h-8 rounded-xl ${ns.bg} flex items-center justify-center`}>
                  <I className={`h-3.5 w-3.5 ${ns.color}`} />
                  <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-black text-slate-400 flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-200 truncate">{s.node.label.slice(0, 70)}{s.node.label.length > 70 ? '…' : ''}</span>
                    {s.repeatCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        ×{s.repeatCount} incidents
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`text-[9px] font-bold ${ns.color}`}>{s.node.type.replace('_', ' ')}</span>
                    <span className={`text-[9px] font-semibold ${cl.color}`}>
                      <Link2 className="h-2.5 w-2.5 inline mr-0.5" />{cl.text}
                    </span>
                    <span className="text-[9px] text-slate-600">depth {s.depth}</span>
                    <span className="text-[9px] text-slate-600">{relTime(s.node.timestamp)}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 w-28">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-slate-500">RCA score</span>
                  </div>
                  <ScoreBar score={s.score} />
                </div>

                {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-500 mt-1 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500 mt-1 flex-shrink-0" />}
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-0 space-y-3 border-t border-slate-700/30 mt-1">
                  {/* Rationale */}
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/30">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Analysis Rationale</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{s.rationale}</p>
                  </div>

                  {/* Score breakdown */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Causal conf.',  value: `${Math.round(s.edgeConfidence * 100)}%`,    sub: `Weight 50% · ${cl.text.toLowerCase()}` },
                      { label: 'Graph depth',   value: `${s.depth}`,                                 sub: `Weight 20% · ${s.depth <= 1 ? 'direct parent' : `${s.depth} hops`}` },
                      { label: 'Repeat count',  value: s.repeatCount > 0 ? `×${s.repeatCount}` : '—', sub: s.repeatCount > 0 ? 'Seen in prior incidents' : 'First occurrence' },
                    ].map(item => (
                      <div key={item.label} className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center">
                        <p className="text-[9px] text-slate-500 mb-1">{item.label}</p>
                        <p className="text-sm font-black text-slate-200">{item.value}</p>
                        <p className="text-[9px] text-slate-600">{item.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Metadata */}
                  {Object.keys(s.node.metadata ?? {}).length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/20">
                      <p className="text-[10px] text-slate-600 font-semibold uppercase mb-1.5">Node Metadata</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(s.node.metadata).map(([k, v]) => (
                          <span key={k} className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                            {k}={String(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scoring model legend */}
      <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 space-y-1.5">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Composite Score Model</p>
        <div className="grid grid-cols-3 gap-3 text-[10px] text-slate-500">
          <span><span className="text-slate-300 font-bold">50%</span> Causal confidence — deterministic 1.0 / strong 0.7 / inferred 0.5</span>
          <span><span className="text-slate-300 font-bold">30%</span> Temporal proximity — linear decay from incident onset over 30min</span>
          <span><span className="text-slate-300 font-bold">20%</span> Causal depth — direct parent 1.0 → deep ancestor 0.25</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-[10px] text-slate-600">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-700" />
        <span>
          Suggestions are probabilistic, not confirmations. Accuracy is bounded by graph completeness.
          Nodes linked via temporal proximity (Inferred) should be manually verified.
          Repeat count improves as the persistent graph accumulates cross-incident data.
        </span>
      </div>
    </div>
  );
}
