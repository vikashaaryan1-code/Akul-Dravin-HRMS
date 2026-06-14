'use client';
import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart2, Info, ChevronRight } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type MitigationActionType = 'reduce_concurrency' | 'pause_queue' | 'priority_rebuild' | 'circuit_break' | 'drain_dlq';
type SloId = 'projection-rebuild-lag' | 'payroll-job-success-rate' | 'dlq-spike' | 'notification-delivery-lag' | 'ai-recompute-latency';

interface ConfidenceRecord {
  action: MitigationActionType; sloId: SloId;
  successPct: number; worsenedPct: number; dataConfidence: number;
  totalAnalyzed: number; expectedRecoveryMin: number | null;
  recommended: boolean; lastUpdated: string;
}

interface RankedMitigation { rank: number; action: MitigationActionType; confidence: ConfidenceRecord; rationale: string }

// ── Demo Data ─────────────────────────────────────────────────────────────────

const RECORDS: ConfidenceRecord[] = [
  { action: 'priority_rebuild',   sloId: 'projection-rebuild-lag',    successPct: 91, worsenedPct: 3,  dataConfidence: 1,    totalAnalyzed: 23, expectedRecoveryMin: 8,  recommended: true,  lastUpdated: new Date(Date.now() - 2 * 3600000).toISOString() },
  { action: 'drain_dlq',          sloId: 'dlq-spike',                 successPct: 78, worsenedPct: 8,  dataConfidence: 1,    totalAnalyzed: 18, expectedRecoveryMin: 12, recommended: true,  lastUpdated: new Date(Date.now() - 4 * 3600000).toISOString() },
  { action: 'pause_queue',        sloId: 'notification-delivery-lag', successPct: 72, worsenedPct: 14, dataConfidence: 0.8,  totalAnalyzed: 8,  expectedRecoveryMin: 6,  recommended: true,  lastUpdated: new Date(Date.now() - 6 * 3600000).toISOString() },
  { action: 'reduce_concurrency', sloId: 'ai-recompute-latency',      successPct: 61, worsenedPct: 31, dataConfidence: 0.9,  totalAnalyzed: 9,  expectedRecoveryMin: 18, recommended: false, lastUpdated: new Date(Date.now() - 8 * 3600000).toISOString() },
  { action: 'circuit_break',      sloId: 'dlq-spike',                 successPct: 44, worsenedPct: 22, dataConfidence: 0.5,  totalAnalyzed: 5,  expectedRecoveryMin: null, recommended: false, lastUpdated: new Date(Date.now() - 12 * 3600000).toISOString() },
];

const RANKED: RankedMitigation[] = [
  { rank: 1, action: 'priority_rebuild', confidence: RECORDS[0], rationale: 'Highly effective (91% success across 23 incidents) · Typical recovery: ~8m' },
  { rank: 2, action: 'drain_dlq',        confidence: RECORDS[1], rationale: 'Highly effective (78% success) · Typical recovery: ~12m' },
  { rank: 3, action: 'pause_queue',      confidence: RECORDS[2], rationale: 'Moderately effective (72% success) · Typical recovery: ~6m · Limited data (8 samples)' },
];

const ACTION_LABELS: Record<MitigationActionType, string> = {
  priority_rebuild: 'Priority Rebuild', reduce_concurrency: 'Reduce Concurrency',
  drain_dlq: 'Drain DLQ', circuit_break: 'Circuit Break', pause_queue: 'Pause Queue',
};

const SLO_LABELS: Record<SloId, string> = {
  'projection-rebuild-lag': 'Projection Lag', 'payroll-job-success-rate': 'Payroll Success',
  'dlq-spike': 'DLQ Spike', 'notification-delivery-lag': 'Notification Lag', 'ai-recompute-latency': 'AI Latency',
};

function ConfidenceBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DataConfidenceBadge({ v }: { v: number }) {
  const label = v >= 0.8 ? 'High' : v >= 0.5 ? 'Med' : 'Low';
  const color = v >= 0.8 ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
              : v >= 0.5 ? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
                         : 'text-slate-400 bg-slate-700/40 border-slate-600/30';
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${color}`}>{label} confidence</span>;
}

type Tab = 'ranked' | 'all' | 'risk';

export function RemediationPanel() {
  const [tab, setTab] = useState<Tab>('ranked');
  const [expanded, setExpanded] = useState<string | null>(null);

  const topRecommended = RECORDS.filter(r => r.recommended);
  const highRisk       = RECORDS.filter(r => r.worsenedPct >= 25);

  const visible = tab === 'ranked' ? RANKED.map(r => r.confidence)
                : tab === 'risk'   ? highRisk
                : RECORDS;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Remediation Intelligence</h1>
          <p className="text-xs text-slate-400 mt-0.5">Evidence-based remediation rankings from historical outcome analysis</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <CheckCircle className="h-3 w-3" /> {topRecommended.length} recommended
          </span>
          {highRisk.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
              <AlertTriangle className="h-3 w-3" /> {highRisk.length} high rollback risk
            </span>
          )}
          <span className="px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-400 text-xs">
            {RECORDS.reduce((sum, r) => sum + r.totalAnalyzed, 0)} incidents analyzed
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['ranked', 'all', 'risk'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'}`}>
            {t === 'ranked' ? '🏆 Top Ranked' : t === 'risk' ? '⚠ High Risk' : 'All Actions'}
          </button>
        ))}
      </div>

      {/* Ranked list */}
      {tab === 'ranked' && (
        <div className="space-y-2">
          {RANKED.map(r => {
            const Icon = r.rank <= 1 ? TrendingUp : BarChart2;
            return (
              <div key={r.action} className="p-4 rounded-2xl bg-slate-800/60 border border-emerald-500/15 hover:border-emerald-500/30 transition cursor-pointer"
                onClick={() => setExpanded(expanded === r.action ? null : r.action)}>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-slate-500">#{r.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-200">{ACTION_LABELS[r.action]}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{SLO_LABELS[r.confidence.sloId]}</span>
                      {r.confidence.recommended && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">RECOMMENDED</span>
                      )}
                      <DataConfidenceBadge v={r.confidence.dataConfidence} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.rationale}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-emerald-400">{r.confidence.successPct}%</p>
                    <p className="text-[10px] text-slate-500">success rate</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-500">Success rate</span>
                      <span className="text-emerald-400 font-bold">{r.confidence.successPct}%</span>
                    </div>
                    <ConfidenceBar pct={r.confidence.successPct} color="bg-emerald-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-500">Worsened rate</span>
                      <span className={`font-bold ${r.confidence.worsenedPct >= 25 ? 'text-red-400' : 'text-slate-400'}`}>{r.confidence.worsenedPct}%</span>
                    </div>
                    <ConfidenceBar pct={r.confidence.worsenedPct} color={r.confidence.worsenedPct >= 25 ? 'bg-red-500' : 'bg-slate-500'} />
                  </div>
                </div>

                {expanded === r.action && (
                  <div className="mt-3 pt-3 border-t border-slate-700/40 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">Analyzed</p>
                      <p className="text-sm font-bold text-slate-300">{r.confidence.totalAnalyzed}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">Avg Recovery</p>
                      <p className="text-sm font-bold text-slate-300">{r.confidence.expectedRecoveryMin != null ? `~${r.confidence.expectedRecoveryMin}m` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">Data conf.</p>
                      <p className="text-sm font-bold text-slate-300">{Math.round(r.confidence.dataConfidence * 100)}%</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* All / Risk table */}
      {(tab === 'all' || tab === 'risk') && (
        <div className="space-y-2">
          {visible.map(r => (
            <div key={`${r.action}:${r.sloId}`}
              className={`p-3 rounded-xl border transition ${r.worsenedPct >= 25 ? 'bg-red-500/8 border-red-500/20' : 'bg-slate-800/50 border-slate-700/30'}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{ACTION_LABELS[r.action]}</span>
                    <span className="text-[10px] text-slate-500">{SLO_LABELS[r.sloId]}</span>
                    {r.worsenedPct >= 25 && <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 w-16 flex-shrink-0">Success</span>
                    <div className="flex-1"><ConfidenceBar pct={r.successPct} color="bg-emerald-500" /></div>
                    <span className="text-[10px] font-bold text-emerald-400 w-8 text-right">{r.successPct}%</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 w-16 flex-shrink-0">Worsened</span>
                    <div className="flex-1"><ConfidenceBar pct={r.worsenedPct} color={r.worsenedPct >= 25 ? 'bg-red-500' : 'bg-slate-500'} /></div>
                    <span className={`text-[10px] font-bold w-8 text-right ${r.worsenedPct >= 25 ? 'text-red-400' : 'text-slate-400'}`}>{r.worsenedPct}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <DataConfidenceBadge v={r.dataConfidence} />
                  <p className="text-[10px] text-slate-500">{r.totalAnalyzed} samples</p>
                  {r.expectedRecoveryMin && <p className="text-[10px] text-slate-400">~{r.expectedRecoveryMin}m recovery</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bootstrap notice when no data */}
      {RECORDS.length === 0 && (
        <div className="py-14 flex flex-col items-center text-center">
          <Info className="h-9 w-9 text-slate-600 mb-3" />
          <p className="text-slate-400 font-semibold text-sm">No outcome data yet</p>
          <p className="text-xs text-slate-600 mt-1 max-w-xs">Rankings populate automatically as mitigation signals are resolved. At least 5 analyzed incidents are required per action before recommendations appear.</p>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-[10px] text-slate-500 space-y-1">
        <p><span className="text-emerald-400 font-bold">RECOMMENDED</span> — successPct ≥ 50% AND worsenedPct &lt; 25% AND ≥ 5 analyzed incidents</p>
        <p><span className="text-red-400 font-bold">High rollback risk</span> — worsenedPct ≥ 25%: historically worsened conditions more than 1-in-4 times</p>
        <p><span className="text-slate-400 font-bold">Data confidence</span> — reaches 100% at 10+ analyzed incidents; rankings below 30% confidence are hidden from ranked view</p>
      </div>
    </div>
  );
}
