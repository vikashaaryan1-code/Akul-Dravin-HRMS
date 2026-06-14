'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle, AlertTriangle, XCircle, Clock, Bell,
  Settings, BarChart2, RefreshCw, ChevronDown, ChevronUp,
  TrendingDown, TrendingUp, Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SloId = 'projection-rebuild-lag' | 'payroll-job-success-rate' | 'dlq-spike' | 'notification-delivery-lag' | 'ai-recompute-latency';
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type SloStatus = 'PASSING' | 'BREACHING' | 'UNKNOWN';
type AlertStatus = 'FIRED' | 'RESOLVED' | 'SUPPRESSED';
type Panel = 'board' | 'timeline' | 'config' | 'analytics';

interface SloResult {
  sloId: SloId; sloName: string; status: SloStatus;
  currentValue: number; threshold: number; unit: string;
  severity: Severity; message: string; deviationPct: number;
  evaluatedAt: string;
}
interface AlertRecord {
  id: string; sloId: SloId; sloName: string; severity: Severity;
  status: AlertStatus; triggeredValue: number; threshold: number;
  unit: string; message: string; firedAt: string; resolvedAt?: string;
  suppressed: boolean;
}
interface SloConfig { sloId: SloId; threshold: number; cooldownMin: number; webhookEnabled: boolean }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SLOS: SloResult[] = [
  { sloId: 'projection-rebuild-lag',   sloName: 'Projection Rebuild Lag',   status: 'BREACHING', currentValue: 87,     threshold: 30,    unit: 'seconds', severity: 'HIGH',     message: "Domain 'workforce' stale for 87s (target: <30s).",                   deviationPct: 190,  evaluatedAt: '2026-05-14T08:55:00Z' },
  { sloId: 'payroll-job-success-rate', sloName: 'Payroll Job Success Rate', status: 'PASSING',   currentValue: 100,    threshold: 99.95, unit: 'percent', severity: 'CRITICAL', message: 'Payroll success rate 100.000% meets 99.95% target.',              deviationPct: -0.05, evaluatedAt: '2026-05-14T08:55:00Z' },
  { sloId: 'dlq-spike',                sloName: 'DLQ Total Depth',          status: 'BREACHING', currentValue: 8,      threshold: 5,     unit: 'count',   severity: 'HIGH',     message: 'DLQ depth 8 EXCEEDS threshold of 5. Immediate investigation.',  deviationPct: 60,   evaluatedAt: '2026-05-14T08:55:00Z' },
  { sloId: 'notification-delivery-lag',sloName: 'Notification Delivery Lag',status: 'PASSING',   currentValue: 14.2,   threshold: 60,    unit: 'seconds', severity: 'MEDIUM',   message: 'Notification delivery lag 14.2s within 60s target.',             deviationPct: -76.3, evaluatedAt: '2026-05-14T08:55:00Z' },
  { sloId: 'ai-recompute-latency',     sloName: 'AI Worker P95 Latency',    status: 'PASSING',   currentValue: 30_000, threshold: 120_000, unit: 'ms',   severity: 'MEDIUM',   message: 'AI p95 latency ~30s within 120s target.',                       deviationPct: -75,  evaluatedAt: '2026-05-14T08:55:00Z' },
];

const MOCK_ALERTS: AlertRecord[] = [
  { id: 'a1', sloId: 'dlq-spike',             sloName: 'DLQ Total Depth',          severity: 'HIGH',     status: 'FIRED',    triggeredValue: 8,  threshold: 5,    unit: 'count',   message: 'DLQ depth 8 EXCEEDS threshold of 5.',         firedAt: '2026-05-14T07:41:00Z', suppressed: false },
  { id: 'a2', sloId: 'projection-rebuild-lag',sloName: 'Projection Rebuild Lag',   severity: 'HIGH',     status: 'FIRED',    triggeredValue: 87, threshold: 30,   unit: 'seconds', message: "Domain 'workforce' stale for 87s.",            firedAt: '2026-05-14T08:55:00Z', suppressed: false },
  { id: 'a3', sloId: 'projection-rebuild-lag',sloName: 'Projection Rebuild Lag',   severity: 'HIGH',     status: 'RESOLVED', triggeredValue: 42, threshold: 30,   unit: 'seconds', message: "Domain 'recruitment' stale for 42s.",          firedAt: '2026-05-14T06:10:00Z', resolvedAt: '2026-05-14T06:18:00Z', suppressed: false },
  { id: 'a4', sloId: 'ai-recompute-latency',  sloName: 'AI Worker P95 Latency',   severity: 'MEDIUM',   status: 'RESOLVED', triggeredValue: 145000, threshold: 120000, unit: 'ms', message: 'AI p95 latency ~145s EXCEEDS 120s.',        firedAt: '2026-05-14T04:30:00Z', resolvedAt: '2026-05-14T04:55:00Z', suppressed: false },
  { id: 'a5', sloId: 'dlq-spike',             sloName: 'DLQ Total Depth',          severity: 'HIGH',     status: 'SUPPRESSED', triggeredValue: 7, threshold: 5, unit: 'count',  message: 'DLQ depth 7 (cooldown active)',               firedAt: '2026-05-14T07:55:00Z', suppressed: true },
];

const DEFAULT_CONFIG: SloConfig[] = [
  { sloId: 'projection-rebuild-lag',   threshold: 30,      cooldownMin: 15, webhookEnabled: true  },
  { sloId: 'payroll-job-success-rate', threshold: 99.95,   cooldownMin: 60, webhookEnabled: true  },
  { sloId: 'dlq-spike',                threshold: 5,       cooldownMin: 15, webhookEnabled: true  },
  { sloId: 'notification-delivery-lag',threshold: 60,      cooldownMin: 10, webhookEnabled: false },
  { sloId: 'ai-recompute-latency',     threshold: 120000,  cooldownMin: 10, webhookEnabled: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: 'text-red-400 bg-red-500/15 border-red-500/30',
  HIGH:     'text-orange-400 bg-orange-500/15 border-orange-500/30',
  MEDIUM:   'text-amber-400 bg-amber-500/15 border-amber-500/30',
  LOW:      'text-blue-400 bg-blue-500/15 border-blue-500/30',
};
const STATUS_ICONS: Record<AlertStatus, React.ReactNode> = {
  FIRED:      <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />,
  RESOLVED:   <CheckCircle   className="h-3.5 w-3.5 text-emerald-400" />,
  SUPPRESSED: <Bell          className="h-3.5 w-3.5 text-slate-500" />,
};
const fmtVal = (v: number, unit: string) =>
  unit === 'ms'      ? `${Math.round(v / 1000)}s`
  : unit === 'percent' ? `${v.toFixed(2)}%`
  : `${v}${unit}`;
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });
const mttr = (fired: string, resolved?: string) => resolved
  ? `${Math.round((new Date(resolved).getTime() - new Date(fired).getTime()) / 60000)}m`
  : '—';

// ─── Component ────────────────────────────────────────────────────────────────

export function SloAlertView() {
  const [panel, setPanel]       = useState<Panel>('board');
  const [configs, setConfigs]   = useState<SloConfig[]>(DEFAULT_CONFIG);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastEval]              = useState('2026-05-14T08:55:00Z');

  const passing   = MOCK_SLOS.filter(s => s.status === 'PASSING').length;
  const breaching = MOCK_SLOS.filter(s => s.status === 'BREACHING').length;
  const activeAlerts = MOCK_ALERTS.filter(a => a.status === 'FIRED' && !a.suppressed).length;

  // Breach analytics
  const stats = useMemo(() => {
    const fired    = MOCK_ALERTS.filter(a => a.status !== 'SUPPRESSED');
    const resolved = fired.filter(a => a.status === 'RESOLVED' && a.resolvedAt);
    const avgMttrMin = resolved.length > 0
      ? Math.round(resolved.reduce((s, a) => s + (new Date(a.resolvedAt!).getTime() - new Date(a.firedAt).getTime()) / 60000, 0) / resolved.length)
      : null;
    const bySev: Record<string, number> = {};
    fired.forEach(a => { bySev[a.severity] = (bySev[a.severity] ?? 0) + 1; });
    return { total: fired.length, avgMttrMin, bySev };
  }, []);

  const PANELS = [
    { id: 'board'     as Panel, label: 'SLO Board',       icon: <CheckCircle className="h-4 w-4" />, badge: breaching || undefined },
    { id: 'timeline'  as Panel, label: 'Alert Timeline',  icon: <Bell        className="h-4 w-4" />, badge: activeAlerts || undefined },
    { id: 'config'    as Panel, label: 'Configuration',   icon: <Settings    className="h-4 w-4" /> },
    { id: 'analytics' as Panel, label: 'Breach Analytics',icon: <BarChart2   className="h-4 w-4" /> },
  ];

  const updateConfig = (sloId: SloId, key: keyof SloConfig, value: any) => {
    setConfigs(prev => prev.map(c => c.sloId === sloId ? { ...c, [key]: value } : c));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">SLO & Alerting</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Service level objectives · breach detection · alert history
            <span className="ml-2 text-slate-600">Last eval: {fmtTime(lastEval)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {breaching > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold">
              <AlertTriangle className="h-3.5 w-3.5" /> {breaching} SLO{breaching > 1 ? 's' : ''} BREACHING
            </span>
          )}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition">
            <RefreshCw className="h-3.5 w-3.5" /> Re-evaluate
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'SLOs Passing',  value: `${passing}/${MOCK_SLOS.length}`, color: 'text-emerald-400', sub: '100% → target' },
          { label: 'Breaching',     value: breaching,          color: 'text-orange-400', sub: 'Active violations' },
          { label: 'Active Alerts', value: activeAlerts,       color: 'text-red-400',    sub: 'Unresolved fired' },
          { label: 'Avg MTTR',      value: stats.avgMttrMin !== null ? `${stats.avgMttrMin}m` : '—', color: 'text-sky-400', sub: 'Time to resolve' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Panel tabs */}
      <div className="flex gap-2 flex-wrap">
        {PANELS.map(p => (
          <button key={p.id} onClick={() => setPanel(p.id)}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${panel === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'}`}>
            {p.icon}{p.label}
            {p.badge !== undefined && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">{p.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── SLO Board ──────────────────────────────────────────────────────── */}
      {panel === 'board' && (
        <div className="space-y-3">
          {MOCK_SLOS.map(slo => {
            const isOpen = expanded === slo.sloId;
            const cfg = configs.find(c => c.sloId === slo.sloId);
            return (
              <div key={slo.sloId}
                className={`rounded-2xl border transition ${slo.status === 'BREACHING' ? 'bg-orange-500/8 border-orange-500/25' : 'bg-slate-800/60 border-slate-700/50'}`}>
                <button className="w-full flex items-center justify-between px-4 py-3"
                  onClick={() => setExpanded(isOpen ? null : slo.sloId)}>
                  <div className="flex items-center gap-3">
                    {slo.status === 'BREACHING'
                      ? <AlertTriangle className="h-4.5 w-4.5 text-orange-400 shrink-0" />
                      : <CheckCircle   className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    }
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">{slo.sloName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{slo.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Current vs threshold */}
                    <div className="text-right">
                      <p className={`text-lg font-bold ${slo.status === 'BREACHING' ? 'text-orange-300' : 'text-emerald-300'}`}>
                        {fmtVal(slo.currentValue, slo.unit)}
                      </p>
                      <p className="text-[10px] text-slate-500">target: {fmtVal(slo.threshold, slo.unit)}</p>
                    </div>
                    {/* Severity badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${SEVERITY_COLORS[slo.severity]}`}>
                      {slo.severity}
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-700/40 pt-3 space-y-3">
                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Deviation from target</span>
                        <span className={slo.deviationPct > 0 ? 'text-orange-400' : 'text-emerald-400'}>
                          {slo.deviationPct > 0 ? '+' : ''}{slo.deviationPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700">
                        <div
                          className={`h-2 rounded-full transition-all ${slo.status === 'BREACHING' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(Math.abs(slo.deviationPct), 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[11px]">
                      <div>
                        <p className="text-slate-500">Cooldown</p>
                        <p className="text-slate-300 font-semibold">{cfg?.cooldownMin ?? 15} min</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Webhook</p>
                        <p className={`font-semibold ${cfg?.webhookEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {cfg?.webhookEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Evaluated</p>
                        <p className="text-slate-300 font-semibold">{fmtTime(slo.evaluatedAt)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Alert Timeline ────────────────────────────────────────────────── */}
      {panel === 'timeline' && (
        <div className="space-y-2">
          {MOCK_ALERTS.map(a => (
            <div key={a.id} className={`flex items-start gap-3 p-3 rounded-2xl border ${a.suppressed ? 'bg-slate-800/30 border-slate-800 opacity-60' : 'bg-slate-800/60 border-slate-700/50'}`}>
              <div className="mt-0.5">{STATUS_ICONS[a.status]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[a.severity]}`}>{a.severity}</span>
                  <span className="text-xs font-semibold text-slate-200">{a.sloName}</span>
                  {a.suppressed && <span className="text-[9px] text-slate-500 italic">suppressed (cooldown)</span>}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{a.message}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtTime(a.firedAt)}</span>
                  {a.status === 'RESOLVED' && a.resolvedAt && (
                    <span className="text-emerald-500">→ resolved {fmtTime(a.resolvedAt)} (MTTR: {mttr(a.firedAt, a.resolvedAt)})</span>
                  )}
                  <span className="font-mono">{fmtVal(a.triggeredValue, a.unit)} vs {fmtVal(a.threshold, a.unit)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Configuration ────────────────────────────────────────────────── */}
      {panel === 'config' && (
        <div className="space-y-3">
          {configs.map(cfg => {
            const slo = MOCK_SLOS.find(s => s.sloId === cfg.sloId)!;
            return (
              <div key={cfg.sloId} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-200">{slo.sloName}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SEVERITY_COLORS[slo.severity]}`}>{slo.severity}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Threshold ({slo.unit})</label>
                    <input
                      type="number" value={cfg.threshold}
                      onChange={e => updateConfig(cfg.sloId, 'threshold', parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Cooldown (min)</label>
                    <input
                      type="number" value={cfg.cooldownMin}
                      onChange={e => updateConfig(cfg.sloId, 'cooldownMin', parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Webhook</label>
                    <button onClick={() => updateConfig(cfg.sloId, 'webhookEnabled', !cfg.webhookEnabled)}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold transition ${cfg.webhookEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {cfg.webhookEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <button className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition">
            Save Configuration
          </button>
        </div>
      )}

      {/* ── Breach Analytics ─────────────────────────────────────────────── */}
      {panel === 'analytics' && (
        <div className="grid gap-4 xl:grid-cols-2">
          {/* Breach summary */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Breach Summary</p>
            <div className="space-y-2">
              {Object.entries(stats.bySev).map(([severity, count]) => (
                <div key={severity} className="flex items-center gap-3">
                  <span className={`w-16 text-[10px] font-bold text-right ${SEVERITY_COLORS[severity as Severity].split(' ')[0]}`}>{severity}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-700">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(count / stats.total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-300 w-4">{count}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-500">Total breaches</p>
                <p className="text-xl font-bold text-slate-200">{stats.total}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Avg MTTR</p>
                <p className="text-xl font-bold text-sky-400">{stats.avgMttrMin !== null ? `${stats.avgMttrMin}m` : '—'}</p>
              </div>
            </div>
          </div>

          {/* SLO health score */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SLO Health Score</p>
            {MOCK_SLOS.map(slo => {
              const breachCount = MOCK_ALERTS.filter(a => a.sloId === slo.sloId && a.status !== 'SUPPRESSED').length;
              return (
                <div key={slo.sloId} className="flex items-center gap-3">
                  {slo.status === 'PASSING'
                    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    : <TrendingDown className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-300 truncate">{slo.sloName}</p>
                      <span className="text-[10px] text-slate-500 ml-2">{breachCount} breach{breachCount !== 1 ? 'es' : ''}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-700">
                      <div className={`h-1.5 rounded-full ${slo.status === 'PASSING' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                        style={{ width: slo.status === 'PASSING' ? '100%' : `${Math.max(10, 100 - Math.abs(slo.deviationPct))}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
