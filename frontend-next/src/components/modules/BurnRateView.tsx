'use client';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

type SloId = 'projection-rebuild-lag' | 'payroll-job-success-rate' | 'dlq-spike' | 'notification-delivery-lag' | 'ai-recompute-latency';
type Window = '1h' | '6h' | '24h' | '7d';
type Trend = 'improving' | 'degrading' | 'stable';

interface BudgetRow { sloId: SloId; name: string; budgetTotalMin: number; budgetUsedMin: number; budgetConsumedPct: number; overdraftMin: number }
interface BurnRow { sloId: SloId; window: Window; rate: number; isFastBurn: boolean; isSlowBurn: boolean; fastBurnThreshold: number; slowBurnThreshold: number; forecastExhaustionMin: number | null; trend: Trend; violationCount: number }
interface WindowRow { sloId: SloId; name: string; window: Window; totalSamples: number; breachSamples: number; breachRate: number; p95Value: number | null; trend: Trend }

const BUDGETS: BudgetRow[] = [
 { sloId: 'projection-rebuild-lag', name: 'Projection Rebuild Lag', budgetTotalMin: 2160, budgetUsedMin: 1440, budgetConsumedPct: 0.667, overdraftMin: 0 },
 { sloId: 'payroll-job-success-rate', name: 'Payroll Job Success Rate', budgetTotalMin: 21.6, budgetUsedMin: 0, budgetConsumedPct: 0, overdraftMin: 0 },
 { sloId: 'dlq-spike', name: 'DLQ Total Depth', budgetTotalMin: 43.2, budgetUsedMin: 25, budgetConsumedPct: 0.579, overdraftMin: 0 },
 { sloId: 'notification-delivery-lag', name: 'Notification Lag', budgetTotalMin: 432, budgetUsedMin: 12, budgetConsumedPct: 0.028, overdraftMin: 0 },
 { sloId: 'ai-recompute-latency', name: 'AI Recompute Latency', budgetTotalMin: 2160, budgetUsedMin: 90, budgetConsumedPct: 0.042, overdraftMin: 0 },
];

const BURN_RATES: BurnRow[] = [
 { sloId: 'projection-rebuild-lag', window: '1h', rate: 8.4, isFastBurn: false, isSlowBurn: true, fastBurnThreshold: 14, slowBurnThreshold: 6, forecastExhaustionMin: 840, trend: 'degrading', violationCount: 4 },
 { sloId: 'projection-rebuild-lag', window: '6h', rate: 4.2, isFastBurn: false, isSlowBurn: false, fastBurnThreshold: 14, slowBurnThreshold: 6, forecastExhaustionMin: null, trend: 'stable', violationCount: 12 },
 { sloId: 'projection-rebuild-lag', window: '24h', rate: 2.1, isFastBurn: false, isSlowBurn: false, fastBurnThreshold: 14, slowBurnThreshold: 6, forecastExhaustionMin: null, trend: 'improving', violationCount: 24 },
 { sloId: 'dlq-spike', window: '1h', rate: 16.2, isFastBurn: true, isSlowBurn: false, fastBurnThreshold: 14, slowBurnThreshold: 6, forecastExhaustionMin: 180, trend: 'degrading', violationCount: 6 },
 { sloId: 'dlq-spike', window: '6h', rate: 5.1, isFastBurn: false, isSlowBurn: false, fastBurnThreshold: 14, slowBurnThreshold: 6, forecastExhaustionMin: null, trend: 'stable', violationCount: 8 },
];

const WINDOWS: WindowRow[] = [
 { sloId: 'projection-rebuild-lag', name: 'Projection Lag', window: '1h', totalSamples: 12, breachSamples: 4, breachRate: 0.333, p95Value: 87, trend: 'degrading' },
 { sloId: 'projection-rebuild-lag', name: 'Projection Lag', window: '6h', totalSamples: 72, breachSamples: 12, breachRate: 0.167, p95Value: 65, trend: 'stable' },
 { sloId: 'projection-rebuild-lag', name: 'Projection Lag', window: '24h', totalSamples: 288, breachSamples: 24, breachRate: 0.083, p95Value: 48, trend: 'improving' },
 { sloId: 'dlq-spike', name: 'DLQ Depth', window: '1h', totalSamples: 12, breachSamples: 6, breachRate: 0.500, p95Value: 9, trend: 'degrading' },
 { sloId: 'dlq-spike', name: 'DLQ Depth', window: '6h', totalSamples: 72, breachSamples: 8, breachRate: 0.111, p95Value: 7, trend: 'stable' },
 { sloId: 'ai-recompute-latency', name: 'AI Latency', window: '24h', totalSamples: 288, breachSamples: 2, breachRate: 0.007, p95Value: 95000,trend: 'improving' },
];

const SLO_NAMES: Record<SloId, string> = {
 'projection-rebuild-lag': 'Projection Lag',
 'payroll-job-success-rate': 'Payroll Success',
 'dlq-spike': 'DLQ Depth',
 'notification-delivery-lag': 'Notif. Lag',
 'ai-recompute-latency': 'AI Latency',
};

const TrendIcon = ({ t }: { t: Trend }) =>
 t === 'degrading' ? <TrendingDown className="h-3.5 w-3.5 text-red-400" /> :
 t === 'improving' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> :
 <Minus className="h-3.5 w-3.5 text-slate-500" />;

const BurnBadge = ({ r }: { r: BurnRow }) =>
 r.isFastBurn ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">FAST</span> :
 r.isSlowBurn ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">SLOW</span> :
 <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">OK</span>;

const fmtHours = (m: number | null) => m === null ? '—' : m < 60 ? `${m}m` : `${(m/60).toFixed(1)}h`;
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

type Panel = 'gauges' | 'burnrate' | 'windows' | 'forecast';

export function BurnRateView() {
 const [panel, setPanel] = useState<Panel>('gauges');
 const [selSlo, setSelSlo] = useState<SloId>('projection-rebuild-lag');

 const fastBurns = BURN_RATES.filter(r => r.isFastBurn).length;
 const slowBurns = BURN_RATES.filter(r => r.isSlowBurn).length;

 const TABS: { id: Panel; label: string; badge?: number }[] = [
 { id: 'gauges', label: 'Error Budgets', badge: BUDGETS.filter(b => b.budgetConsumedPct > 0.8).length || undefined },
 { id: 'burnrate', label: 'Burn Rates', badge: (fastBurns + slowBurns) || undefined },
 { id: 'windows', label: 'Window Analysis' },
 { id: 'forecast', label: 'Forecast' },
 ];

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-xl font-bold text-slate-100">Error Budget & Burn Rate</h1>
 <p className="text-xs text-slate-500 mt-0.5">Rolling reliability capital · burn velocity · depletion forecast</p>
 </div>
 {(fastBurns > 0) && (
 <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
 <Zap className="h-3.5 w-3.5" /> {fastBurns} FAST BURN
 </span>
 )}
 </div>

 {/* Tabs */}
 <div className="flex gap-2 flex-wrap">
 {TABS.map(t => (
 <button key={t.id} onClick={() => setPanel(t.id)}
 className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition ${panel === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-50/70 text-slate-500 hover:text-slate-700'}`}>
 {t.label}
 {t.badge !== undefined && (
 <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">{t.badge}</span>
 )}
 </button>
 ))}
 </div>

 {/* Error Budget Gauges */}
 {panel === 'gauges' && (
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
 {BUDGETS.map(b => {
 const pct = Math.min(b.budgetConsumedPct * 100, 100);
 const over = b.budgetConsumedPct >= 1;
 const warn = b.budgetConsumedPct >= 0.8;
 return (
 <div key={b.sloId} className={`p-4 rounded-2xl border ${over ? 'bg-red-500/10 border-red-500/30' : warn ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50/60 border-slate-200/50'}`}>
 <p className="text-xs font-semibold text-slate-600 mb-3">{b.name}</p>
 {/* Radial-style gauge as stacked bars */}
 <div className="h-3 rounded-full bg-slate-700 mb-2 overflow-hidden">
 <div className={`h-3 rounded-full transition-all ${over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-indigo-500'}`}
 style={{ width: `${pct}%` }} />
 </div>
 <div className="flex justify-between text-[10px]">
 <span className={`font-bold text-base ${over ? 'text-red-300' : warn ? 'text-amber-300' : 'text-slate-700'}`}>
 {fmtPct(b.budgetConsumedPct)} consumed
 </span>
 <span className="text-slate-500">{b.budgetUsedMin.toFixed(1)} / {b.budgetTotalMin.toFixed(1)} min</span>
 </div>
 {over && <p className="text-[10px] text-red-400 mt-1 font-semibold">Budget overdrawn by {b.overdraftMin.toFixed(1)}m</p>}
 <p className="text-[10px] text-slate-500 mt-1">30-day window</p>
 </div>
 );
 })}
 </div>
 )}

 {/* Burn Rate Table */}
 {panel === 'burnrate' && (
 <div className="space-y-2">
 <div className="grid grid-cols-7 gap-2 px-3 pb-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
 <span className="col-span-2">SLO</span><span>Window</span><span>Rate</span><span>Status</span><span>Trend</span><span>Exhaustion</span>
 </div>
 {BURN_RATES.map((r, i) => (
 <div key={i} className={`grid grid-cols-7 gap-2 items-center px-3 py-2.5 rounded-xl border ${r.isFastBurn ? 'bg-red-500/10 border-red-500/25' : r.isSlowBurn ? 'bg-orange-500/10 border-orange-500/25' : 'bg-slate-50/60 border-slate-200/50'}`}>
 <span className="col-span-2 text-xs font-semibold text-slate-700 truncate">{SLO_NAMES[r.sloId]}</span>
 <span className="text-xs font-mono text-slate-500">{r.window}</span>
 <span className={`text-sm font-bold ${r.isFastBurn ? 'text-red-300' : r.isSlowBurn ? 'text-orange-300' : 'text-emerald-300'}`}>{r.rate}×</span>
 <BurnBadge r={r} />
 <TrendIcon t={r.trend} />
 <span className="text-xs text-slate-500">{fmtHours(r.forecastExhaustionMin)}</span>
 </div>
 ))}
 <div className="mt-3 p-3 rounded-xl bg-slate-50/40 border border-slate-200/30 text-[10px] text-slate-500 space-y-0.5">
 <p><span className="text-red-400 font-bold">FAST</span> — burn rate ≥ 14× → budget exhausts in &lt;2 days → immediate page</p>
 <p><span className="text-orange-400 font-bold">SLOW</span> — burn rate ≥ 6× → budget exhausts in &lt;7 days → investigation alert</p>
 </div>
 </div>
 )}

 {/* Rolling Window Analysis */}
 {panel === 'windows' && (
 <div className="space-y-4">
 <div className="flex gap-2 flex-wrap">
 {(Object.keys(SLO_NAMES) as SloId[]).map(id => (
 <button key={id} onClick={() => setSelSlo(id)}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${selSlo === id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}>
 {SLO_NAMES[id]}
 </button>
 ))}
 </div>
 <div className="space-y-2">
 {WINDOWS.filter(w => w.sloId === selSlo).map((w, i) => (
 <div key={i} className="p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200/50">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded-lg bg-slate-700 text-slate-600 text-[10px] font-bold">{w.window}</span>
 <TrendIcon t={w.trend} />
 <span className={`text-[10px] ${w.trend === 'degrading' ? 'text-red-400' : w.trend === 'improving' ? 'text-emerald-400' : 'text-slate-500'}`}>{w.trend}</span>
 </div>
 <span className="text-[10px] text-slate-500">{w.breachSamples}/{w.totalSamples} samples breached</span>
 </div>
 <div className="grid grid-cols-3 gap-3 text-[11px]">
 <div><p className="text-slate-500">Breach rate</p><p className={`font-bold ${w.breachRate > 0.2 ? 'text-orange-300' : 'text-emerald-300'}`}>{fmtPct(w.breachRate)}</p></div>
 <div><p className="text-slate-500">p95 value</p><p className="text-slate-700 font-bold">{w.p95Value !== null ? (w.p95Value > 1000 ? `${Math.round(w.p95Value/1000)}s` : `${w.p95Value}s`) : '—'}</p></div>
 <div><p className="text-slate-500">Violations</p><p className="text-slate-700 font-bold">{w.breachSamples}</p></div>
 </div>
 <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
 <div className={`h-1.5 rounded-full ${w.breachRate > 0.2 ? 'bg-orange-500' : 'bg-indigo-500'}`}
 style={{ width: `${Math.min(w.breachRate * 100 * 5, 100)}%` }} />
 </div>
 </div>
 ))}
 {WINDOWS.filter(w => w.sloId === selSlo).length === 0 && (
 <div className="py-10 text-center text-slate-600 text-sm">No window data for this SLO yet</div>
 )}
 </div>
 </div>
 )}

 {/* Forecast Panel */}
 {panel === 'forecast' && (
 <div className="space-y-3">
 {BURN_RATES.filter(r => r.forecastExhaustionMin !== null).map((r, i) => {
 const hrs = (r.forecastExhaustionMin! / 60);
 const urgent = hrs < 4;
 return (
 <div key={i} className={`p-4 rounded-2xl border ${urgent ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 {urgent ? <AlertTriangle className="h-4 w-4 text-red-400" /> : <Clock className="h-4 w-4 text-amber-400" />}
 <div>
 <p className="text-sm font-bold text-slate-700">{SLO_NAMES[r.sloId]}</p>
 <p className="text-[10px] text-slate-500">{r.window} window · burn rate {r.rate}×</p>
 </div>
 </div>
 <div className="text-right">
 <p className={`text-2xl font-bold ${urgent ? 'text-red-300' : 'text-amber-300'}`}>{fmtHours(r.forecastExhaustionMin)}</p>
 <p className="text-[10px] text-slate-500">until exhaustion</p>
 </div>
 </div>
 </div>
 );
 })}
 {BURN_RATES.filter(r => r.forecastExhaustionMin !== null).length === 0 && (
 <div className="py-16 flex flex-col items-center text-slate-600">
 <CheckCircle className="h-10 w-10 mb-3 text-emerald-500/50" />
 <p className="text-slate-500 font-semibold">All budgets healthy</p>
 <p className="text-xs mt-1">No active depletion forecasts</p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
