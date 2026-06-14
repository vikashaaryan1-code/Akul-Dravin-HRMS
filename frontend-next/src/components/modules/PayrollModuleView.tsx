'use client';

import { useMemo, useState, useCallback } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { payrollSummary, monthlyPayrollTrend } from '@/services/platform-data';
import { platformApi, PayrollItemApiRecord } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency } from '@/utils/formatters';
import { SkeletonCard, SkeletonTable } from '@/components/system/Suspense';
import { useRunPayrollCycle, usePayrollKpis } from '@/hooks/api';
import {
  Download, FileText, Loader2, AlertCircle, ChevronRight,
  DollarSign, Play, CheckCircle2, TrendingUp, Users, RefreshCw,
  Banknote, Award, Calendar, AlertTriangle,
} from 'lucide-react';

// ── Helper ────────────────────────────────────────────────────────────────────

function formatPeriod(item: PayrollItemApiRecord): string {
  if (item.metadata?.period) return item.metadata.period;
  // Fall back to createdAt month/year
  const d = new Date(item.createdAt);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ── Payslip Row ───────────────────────────────────────────────────────────────

function PayslipRow({ item }: { item: PayrollItemApiRecord }) {
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError]         = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setDlError(null);
    try {
      const { blob, filename } = await platformApi.downloadPayslipBlob(item.id);
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDlError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  }, [item.id]);

  const statusColors: Record<string, string> = {
    success:    'text-emerald-400 bg-emerald-400/10',
    calculated: 'text-sky-400 bg-sky-400/10',
    failed:     'text-red-400 bg-red-400/10',
    pending:    'text-amber-400 bg-amber-400/10',
  };
  const statusClass = statusColors[item.executionStatus?.toLowerCase()] ?? 'text-slate-400 bg-slate-400/10';

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/10 hover:bg-white/[0.06]">
      <FileText className="h-5 w-5 shrink-0 text-slate-500" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">
          Payslip — {formatPeriod(item)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Gross: {formatCurrency(Number(item.grossSalary))} &nbsp;·&nbsp;
          Net: <span className="text-emerald-400 font-medium">{formatCurrency(Number(item.netPayable))}</span>
        </p>
        {dlError && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
            <AlertCircle className="h-3 w-3" /> {dlError}
          </p>
        )}
      </div>

      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}>
        {item.executionStatus ?? item.calculationStatus}
      </span>

      <button
        id={`download-payslip-${item.id}`}
        type="button"
        disabled={downloading}
        onClick={handleDownload}
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50"
        aria-label={`Download payslip for ${formatPeriod(item)}`}
      >
        {downloading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Download className="h-3.5 w-3.5" />
        }
        {downloading ? 'Downloading…' : 'Download PDF'}
      </button>
    </div>
  );
}

// ── Run Payroll Panel ────────────────────────────────────────────────────────
function RunPayrollPanel() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [confirmed, setConfirmed] = useState(false);
  const runPayroll = useRunPayrollCycle();

  const handleRun = () => {
    if (!confirmed) { setConfirmed(true); return; }
    runPayroll.mutate(
      { month },
      {
        onSuccess: () => setConfirmed(false),
        onError: () => setConfirmed(false),
      },
    );
  };

  return (
    <GlassCard className="p-5 border border-white/8">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-jade/20 to-emerald-600/10 flex items-center justify-center">
          <Play className="h-4 w-4 text-jade" />
        </div>
        <p className="text-sm font-semibold text-white">Run Payroll</p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="payroll-month" className="text-[10px] uppercase tracking-[0.12em] text-slate-500 block mb-1.5">Payroll Month</label>
          <input
            id="payroll-month"
            type="month"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setConfirmed(false); }}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-jade/30 transition-colors"
          />
        </div>

        {runPayroll.isSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-jade/10 border border-jade/20 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-jade shrink-0" />
            <p className="text-xs text-jade font-semibold">Payroll processed successfully!</p>
          </div>
        )}

        {runPayroll.isError && (
          <div className="flex items-center gap-2 rounded-xl bg-ember/10 border border-ember/20 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-ember shrink-0" />
            <p className="text-xs text-ember font-semibold">Failed to run payroll. Try again.</p>
          </div>
        )}

        {confirmed && !runPayroll.isPending && (
          <div className="rounded-xl bg-gold/10 border border-gold/20 px-3 py-2">
            <p className="text-xs text-gold font-semibold">⚠ This will process payroll for {month}. Click again to confirm.</p>
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={runPayroll.isPending}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-50 ${
            confirmed
              ? 'bg-gradient-to-r from-ember to-red-600 text-white hover:opacity-90'
              : 'bg-gradient-to-r from-jade/80 to-emerald-600 text-white hover:opacity-90'
          }`}
        >
          {runPayroll.isPending ? (
            <><RefreshCw className="h-4 w-4 animate-spin" /> Processing…</>
          ) : confirmed ? (
            <><AlertTriangle className="h-4 w-4" /> Confirm & Run</>
          ) : (
            <><Play className="h-4 w-4" /> Run Payroll</>
          )}
        </button>
      </div>
    </GlassCard>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function PayrollModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  // Payroll batches (existing)
  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const rows = await platformApi.getPayroll();
      let commissionRows: Awaited<ReturnType<typeof platformApi.getSalesCommissions>> = [];
      try {
        commissionRows = await platformApi.getSalesCommissions();
      } catch {
        commissionRows = [];
      }
      return { payrollRows: rows, commissionRows };
    },
    fallback: { payrollRows: [], commissionRows: [] },
  });

  // My Payslips (self-service — independent fetch)
  const {
    data:    payslipData,
    isLive:  payslipsLive,
    loading: payslipsLoading,
    error:   payslipsError,
  } = useApiResource({
    loader:   () => platformApi.getMyPayslips(),
    fallback: [] as PayrollItemApiRecord[],
  });

  const myPayslips: PayrollItemApiRecord[] = Array.isArray(payslipData) ? payslipData : [];

  const computed = useMemo(() => {
    if (!isLive || data.payrollRows.length === 0) {
      return {
        payout:         851000,
        totalGross:     720000,
        targetBonus:    124000,
        daysWiseSalary: 638000,
        breakdown:      payrollSummary,
        trend:          monthlyPayrollTrend,
      };
    }

    const payout          = data.payrollRows.reduce((sum, row) => sum + Number(row.netPay), 0);
    const totalGross      = data.payrollRows.reduce((sum, row) => sum + Number(row.grossPay), 0);
    const totalDeductions = data.payrollRows.reduce((sum, row) => sum + Number(row.deductions), 0);
    const targetBonus     = data.commissionRows.reduce((sum, row) => sum + Number(row.calculatedCommission), 0);

    const byMonth = new Map<string, number>();
    data.payrollRows.forEach((row) => {
      byMonth.set(row.payrollMonth, (byMonth.get(row.payrollMonth) ?? 0) + Number(row.netPay));
    });

    const trend = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ name: month, value: Number(value.toFixed(2)) }));

    return {
      payout,
      totalGross,
      targetBonus,
      daysWiseSalary: Math.max(0, totalGross - totalDeductions),
      breakdown: [
        { name: 'Gross Pay',        value: Number(totalGross.toFixed(2)) },
        { name: 'Deductions',       value: Number(totalDeductions.toFixed(2)) },
        { name: 'Net Pay',          value: Number(payout.toFixed(2)) },
        { name: 'Commission Bonus', value: Number(targetBonus.toFixed(2)) },
      ],
      trend: trend.length > 0 ? trend : monthlyPayrollTrend,
    };
  }, [data.commissionRows, data.payrollRows, isLive]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Payroll Dashboard"
        description="Monthly payroll summary, salary calculations, target-based bonus, and days-wise salary analytics."
      />

      <ModuleLinksBar
        links={[
          { label: 'Attendance',       href: `/attendance?role=${activeRole}` },
          { label: 'Employees',        href: `/employees?role=${activeRole}` },
          { label: 'Sales Commission', href: `/sales?role=${activeRole}` },
          { label: 'Documents',        href: `/documents?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      {/* Summary KPI Cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : [
          { label: 'Monthly Net Payout',   value: formatCurrency(computed.payout),         icon: Banknote,   color: 'text-jade',  gradient: 'from-jade/20 to-emerald-500/5',  trend: '+1.8%' },
          { label: 'Total Gross Salary',   value: formatCurrency(computed.totalGross),      icon: DollarSign, color: 'text-gold',  gradient: 'from-gold/20 to-amber-500/5',    trend: '+2.3%' },
          { label: 'Incentive & Bonus',    value: formatCurrency(computed.targetBonus),     icon: Award,      color: 'text-ember', gradient: 'from-ember/20 to-red-500/5',     trend: '+4.1%' },
          { label: 'Days-Wise Salary',     value: formatCurrency(computed.daysWiseSalary),  icon: Calendar,   color: 'text-aqua',  gradient: 'from-aqua/20 to-cyan-500/5',     trend: '—' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <GlassCard key={card.label}>
              <div className={`p-5 rounded-2xl bg-gradient-to-br ${card.gradient}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center ${card.color}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold text-jade">{card.trend}</span>
                </div>
                <p className="text-2xl font-black text-white">{card.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.13em] text-slate-400">{card.label}</p>
              </div>
            </GlassCard>
          );
        })}
      </section>

      {/* Run Payroll panel */}
      <section className="grid gap-4 xl:grid-cols-4">
        <div className="xl:col-span-1">
          <RunPayrollPanel />
        </div>
        <div className="xl:col-span-3 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            { label: 'Employees Processed', value: data.payrollRows.length || 248,  icon: Users,       color: 'text-aqua'  },
            { label: 'Avg Net Pay',          value: formatCurrency(computed.payout / Math.max(data.payrollRows.length || 248, 1)), icon: TrendingUp, color: 'text-gold'  },
            { label: 'Payroll Status',       value: isLive ? 'Live' : 'Snapshot',   icon: CheckCircle2, color: 'text-jade'  },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <GlassCard key={stat.label}>
                <div className="p-5">
                  <Icon className={`h-5 w-5 ${stat.color} mb-3`} aria-hidden="true" />
                  <p className="text-xl font-black text-white">{stat.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.13em] text-slate-500">{stat.label}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DonutChartCard title="Salary Breakdown" data={computed.breakdown} />
        <TrendAreaChart title="Monthly Payroll Trend" data={computed.trend} color="#E85A2A" />
      </section>

      {/* ── My Payslips (Employee Self-Service) ────────────────────────────── */}
      <section id="my-payslips">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">My Payslips</h2>
            <p className="text-xs text-slate-500">
              {payslipsLive
                ? `${myPayslips.length} payslip${myPayslips.length !== 1 ? 's' : ''} available`
                : 'Download your salary slips as PDF'
              }
            </p>
          </div>
          {payslipsLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          )}
        </div>

        {payslipsError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not load payslips. Please try again later.
          </div>
        )}

        {!payslipsLoading && !payslipsError && myPayslips.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-slate-700" />
            <p className="text-sm font-medium text-slate-500">No payslips yet</p>
            <p className="mt-1 text-xs text-slate-600">
              Payslips appear here once your employer processes payroll.
            </p>
          </div>
        )}

        {myPayslips.length > 0 && (
          <div className="space-y-2">
            {myPayslips.map((item) => (
              <PayslipRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Feature Cards */}
      <section className="grid gap-3 md:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Target-Based Salary Automation</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Incentive slabs are auto-calculated against employee and team achievements with exception-based approvals.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>Bonus variance alerts at department level</li>
            <li>Goal-linked payout simulation before closing cycle</li>
            <li>AI recommendations for incentive optimization</li>
          </ul>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Days-Wise Payroll Calculation</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Attendance, leave balance, late-mark rules, and overtime are converted to payroll-ready values automatically.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>Multi-shift attendance normalization</li>
            <li>Leave encashment and loss-of-pay adjustments</li>
            <li>Auto-generated salary slips and audit logs</li>
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}
