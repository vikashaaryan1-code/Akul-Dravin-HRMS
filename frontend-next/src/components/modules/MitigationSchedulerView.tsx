'use client';
import { useState, useMemo } from 'react';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, Shield, Inbox, Database,
  GitBranch, Layers, ChevronRight, Info, UserCheck, RefreshCw, Trash2,
  BarChart2, Activity, Zap, Eye,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type DeferralReason =
  | 'RESOURCE_BUSY' | 'STABILIZING' | 'BACKOFF'
  | 'PENDING_APPROVAL' | 'DEPENDENCY_INCOMPLETE';

interface DeferralCondition {
  type:             DeferralReason;
  resourceKey?:     string;
  owningSignalId?:  string;
  dependsOnSignalId?: string;
  approved?:        boolean;
  nextEligibleAt?:  string;
  retryCount?:      number;
}

interface DeferredMitigation {
  id:             string;
  match:          { policy: { id: string; name: string; urgency: string; action: string; targetResource: string } };
  condition:      DeferralCondition;
  enqueuedAt:     string;
  totalDeferrals: number;
  maxDeferrals:   number;
  lastCheckedAt?: string;
  dropReason?:    string;
}

interface SchedulerStats {
  total:           number;
  byReason:        Partial<Record<DeferralReason, number>>;
  pendingApproval: DeferredMitigation[];
  nearExpiry:      DeferredMitigation[];
}

// ── Demo Data ─────────────────────────────────────────────────────────────────

const NOW = Date.now();
const iso = (offset: number) => new Date(NOW - offset * 60000).toISOString();

const DEMO_QUEUE: DeferredMitigation[] = [
  {
    id: 'def-1', enqueuedAt: iso(12), totalDeferrals: 2, maxDeferrals: 6,
    lastCheckedAt: iso(2),
    match: { policy: { id: 'p-dlq-circuit', name: 'DLQ Slow-Burn Circuit Break', urgency: 'HIGH', action: 'circuit_break', targetResource: 'queue:notifications' } },
    condition: { type: 'RESOURCE_BUSY', resourceKey: 'dlq-spike:queue:notifications', owningSignalId: 'sig-pause-7f2a' },
  },
  {
    id: 'def-2', enqueuedAt: iso(8), totalDeferrals: 1, maxDeferrals: 6,
    lastCheckedAt: iso(3),
    match: { policy: { id: 'p-ai-slow', name: 'AI Slow-Burn Throttle', urgency: 'HIGH', action: 'reduce_concurrency', targetResource: 'queue:ai-jobs' } },
    condition: { type: 'STABILIZING', resourceKey: 'ai-recompute:queue:ai-jobs', owningSignalId: 'sig-rebuild-9a1c' },
  },
  {
    id: 'def-3', enqueuedAt: iso(45), totalDeferrals: 5, maxDeferrals: 6,
    lastCheckedAt: iso(5),
    match: { policy: { id: 'p-payroll-pause', name: 'Payroll Queue Pause', urgency: 'MEDIUM', action: 'pause_queue', targetResource: 'queue:payroll' } },
    condition: { type: 'PENDING_APPROVAL', approved: false },
  },
  {
    id: 'def-4', enqueuedAt: iso(3), totalDeferrals: 0, maxDeferrals: 6,
    lastCheckedAt: iso(0),
    match: { policy: { id: 'p-notif-backoff', name: 'Notification Backoff Retry', urgency: 'MEDIUM', action: 'drain_dlq', targetResource: 'queue:notifications' } },
    condition: { type: 'BACKOFF', nextEligibleAt: new Date(NOW + 8 * 60000).toISOString(), retryCount: 1 },
  },
];

const DEMO_STATS: SchedulerStats = {
  total: 4,
  byReason: { RESOURCE_BUSY: 1, STABILIZING: 1, PENDING_APPROVAL: 1, BACKOFF: 1 },
  pendingApproval: [DEMO_QUEUE[2]],
  nearExpiry: [DEMO_QUEUE[2]],  // def-3 at 5/6 deferrals
};

// ── Styling ───────────────────────────────────────────────────────────────────

const REASON_STYLE: Record<DeferralReason, { label: string; color: string; bg: string; border: string; icon: any; desc: string }> = {
  RESOURCE_BUSY:         { label: 'Resource Busy',    color: 'text-orange-400', bg: 'bg-orange-500/12',  border: 'border-orange-500/30',  icon: Shield,    desc: 'Waiting for owning signal to resolve' },
  STABILIZING:           { label: 'Stabilizing',      color: 'text-blue-400',   bg: 'bg-blue-500/12',    border: 'border-blue-500/30',    icon: Activity,  desc: 'Waiting for stabilization window to expire' },
  BACKOFF:               { label: 'Backoff',           color: 'text-amber-400',  bg: 'bg-amber-500/12',   border: 'border-amber-500/30',   icon: RefreshCw, desc: 'Exponential retry backoff in progress' },
  PENDING_APPROVAL:      { label: 'Pending Approval',  color: 'text-violet-400', bg: 'bg-violet-500/12',  border: 'border-violet-500/30',  icon: UserCheck, desc: 'Requires operator approval to proceed' },
  DEPENDENCY_INCOMPLETE: { label: 'Dependency',        color: 'text-cyan-400',   bg: 'bg-cyan-500/12',    border: 'border-cyan-500/30',    icon: GitBranch, desc: 'Waiting for dependent signal to complete' },
};

function relTime(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 0) return `in ${Math.abs(m)}m`;
  return m < 60 ? `${m}m ago` : `${(m / 60).toFixed(1)}h ago`;
}

function ExpiryBar({ total, max }: { total: number; max: number }) {
  const pct = Math.round((total / max) * 100);
  const color = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-slate-600';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 flex-1 rounded-full bg-slate-700/60 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-slate-500 w-10 text-right">{total}/{max} ticks</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MitigationSchedulerView() {
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const stats = DEMO_STATS;
  const queue = DEMO_QUEUE;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Mitigation Workflow Scheduler</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deferred mitigation queue · condition-based eligibility · operator approval gate
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] flex-wrap">
          <span className="px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/40 text-slate-400">
            {queue.length} deferred
          </span>
          {stats.nearExpiry.length > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-semibold">
              ⚠ {stats.nearExpiry.length} near expiry
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.entries(stats.byReason) as [DeferralReason, number][]).map(([reason, count]) => {
          const s = REASON_STYLE[reason];
          const I = s.icon;
          return (
            <div key={reason} className={`p-2.5 rounded-xl border ${s.bg} ${s.border}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <I className={`h-3 w-3 ${s.color}`} />
                <span className={`text-[9px] font-bold ${s.color} truncate`}>{s.label}</span>
              </div>
              <p className={`text-xl font-black ${s.color}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* PENDING_APPROVAL alert */}
      {stats.pendingApproval.length > 0 && (
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center gap-2.5">
          <UserCheck className="h-4 w-4 text-violet-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-violet-300">
              {stats.pendingApproval.length} mitigation(s) awaiting operator approval
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              These will not execute until approved. They expire after 72 deferrals (≈6h).
            </p>
          </div>
        </div>
      )}

      {/* Queue */}
      <div className="space-y-2">
        {queue.length === 0 && (
          <div className="text-center p-8 text-slate-600 text-sm">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-600/30" />
            Scheduler queue is empty
          </div>
        )}

        {queue.map(entry => {
          const s     = REASON_STYLE[entry.condition.type];
          const I     = s.icon;
          const isExp = expanded === entry.id;
          const expiryPct = entry.totalDeferrals / entry.maxDeferrals;
          const isNearExpiry = expiryPct >= 0.8;
          const isPendingApproval = entry.condition.type === 'PENDING_APPROVAL';

          return (
            <div key={entry.id}
              className={`rounded-2xl border transition-all ${isExp ? 'bg-slate-800/70 border-slate-600/50' : `bg-slate-800/40 ${isNearExpiry ? 'border-red-500/30' : 'border-slate-700/30 hover:border-slate-600/40'}`}`}>

              {/* Summary row */}
              <div className="flex items-start gap-3 p-3.5 cursor-pointer" onClick={() => setExpanded(isExp ? null : entry.id)}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl ${s.bg} ${s.border} border flex items-center justify-center`}>
                  <I className={`h-3.5 w-3.5 ${s.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-200 truncate">{entry.match.policy.name}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${s.bg} ${s.border} ${s.color}`}>{s.label}</span>
                    {isNearExpiry && <span className="text-[9px] text-red-400 font-bold">⚠ near expiry</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
                  <ExpiryBar total={entry.totalDeferrals} max={entry.maxDeferrals} />
                </div>

                <div className="flex-shrink-0 flex items-center gap-2">
                  {isPendingApproval && !entry.condition.approved && (
                    <button
                      onClick={e => { e.stopPropagation(); setApproving(entry.id); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[10px] font-semibold hover:bg-violet-600/50 transition">
                      <UserCheck className="h-3 w-3" />
                      Approve
                    </button>
                  )}
                  <div className="text-[9px] text-slate-600 text-right">
                    <p>queued {relTime(entry.enqueuedAt)}</p>
                    {entry.lastCheckedAt && <p>checked {relTime(entry.lastCheckedAt)}</p>}
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 text-slate-600 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Expanded detail */}
              {isExp && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-slate-700/20 space-y-3 mt-1">
                  {/* Condition detail */}
                  <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/20 space-y-1.5">
                    <p className="text-[9px] text-slate-600 font-semibold uppercase">Deferral Condition</p>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/30">type={entry.condition.type}</span>
                      {entry.condition.resourceKey && <span className="font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/30">resource={entry.condition.resourceKey}</span>}
                      {entry.condition.owningSignalId && <span className="font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">owning={entry.condition.owningSignalId}</span>}
                      {entry.condition.nextEligibleAt && <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">eligible={relTime(entry.condition.nextEligibleAt)}</span>}
                      {entry.condition.retryCount !== undefined && <span className="font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/30">retries={entry.condition.retryCount}</span>}
                    </div>
                  </div>

                  {/* Policy info */}
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    {[
                      { label: 'Action',    value: entry.match.policy.action },
                      { label: 'Resource',  value: entry.match.policy.targetResource },
                      { label: 'Urgency',   value: entry.match.policy.urgency },
                    ].map(item => (
                      <div key={item.label} className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
                        <p className="text-[9px] text-slate-600 mb-0.5">{item.label}</p>
                        <p className="font-mono text-slate-300 font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isPendingApproval && (
                      <button
                        onClick={() => setApproving(entry.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-semibold hover:bg-violet-600/50 transition">
                        <UserCheck className="h-3.5 w-3.5" />
                        Approve Mitigation
                      </button>
                    )}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                      Drop
                    </button>
                    <span className="text-[9px] text-slate-700 font-mono flex items-center ml-auto">id: {entry.id}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Deferral semantics reference */}
      <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20 space-y-2">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Deferral Condition Reference</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
          {(Object.entries(REASON_STYLE) as [DeferralReason, typeof REASON_STYLE[DeferralReason]][]).map(([r, s]) => (
            <div key={r} className="flex items-start gap-1.5">
              <s.icon className={`h-3 w-3 ${s.color} mt-0.5 flex-shrink-0`} />
              <span className="text-slate-500"><span className={`font-semibold ${s.color}`}>{s.label}</span> — {s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 text-[10px] text-slate-600">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-700" />
        <span>
          BACKOFF uses exponential delay: 5m → 10m → 20m → 40m → 60m cap.
          PENDING_APPROVAL entries expire after 72 deferrals (≈6h).
          All other conditions expire after 6 deferrals (≈30m).
          Entries are idempotent: re-deferring the same policy ID updates the condition rather than creating a duplicate.
        </span>
      </div>
    </div>
  );
}
