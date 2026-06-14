'use client';

import { DollarSign, TrendingUp, Award, Receipt, Target, BarChart3 } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useSalesCommissions, useSalesSummary } from '@/hooks/useDomainData';

export function RecruiterRevenueModuleView() {
  const { commissions, loading } = useSalesCommissions();
  const { summary } = useSalesSummary();

  const totalCommission = commissions.reduce((s: number, c: any) => s + Number(c.commissionAmount ?? c.amount ?? 0), 0);
  const paidCommission = commissions.filter((c: any) => c.status === 'Paid').reduce((s: number, c: any) => s + Number(c.commissionAmount ?? c.amount ?? 0), 0);
  const pendingCommission = totalCommission - paidCommission;

  const columns: ColumnDef<Record<string, unknown>>[] = [
    { key: 'employeeName', label: 'Recruiter', sortable: true },
    { key: 'period', label: 'Period', sortable: true },
    { key: 'dealValue', label: 'Deal Value', sortable: true, render: (v) => v ? <span className="font-semibold">₹{Number(v).toLocaleString('en-IN')}</span> : '—' },
    { key: 'commissionAmount', label: 'Commission', sortable: true, render: (v) => <span className="font-semibold text-emerald-600">₹{Number(v ?? 0).toLocaleString('en-IN')}</span> },
    { key: 'commissionRate', label: 'Rate', sortable: true, render: (v) => v ? `${String(v)}%` : '—' },
    { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusPill label={v as string} /> },
  ];

  return (
    <div className="space-y-5 animate-rise">
      <PageTitle title="Recruiter Revenue" description="Track commissions, deal values and recruiter earnings." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Revenue Pipeline', value: `₹${((summary.totalDealValue || 0) / 100000).toFixed(1)}L`, icon: <BarChart3 className="h-4 w-4 text-blue-500" /> },
          { label: 'Total Commissions', value: `₹${(totalCommission / 1000).toFixed(1)}K`, icon: <DollarSign className="h-4 w-4 text-violet-500" /> },
          { label: 'Commission Paid', value: `₹${(paidCommission / 1000).toFixed(1)}K`, icon: <Award className="h-4 w-4 text-emerald-500" /> },
          { label: 'Commission Pending', value: `₹${(pendingCommission / 1000).toFixed(1)}K`, icon: <Receipt className="h-4 w-4 text-amber-500" /> },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p></div>
              <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">{s.icon}</span>
            </div>
          </GlassCard>
        ))}
      </section>

      {/* Target achievement */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Revenue Target Achievement</p>
          <span className="text-sm font-bold text-blue-600">{summary.targetAchievementPercent ?? 68}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700" style={{ width: `${summary.targetAchievementPercent ?? 68}%` }} />
        </div>
        <div className="mt-3 flex gap-6 text-xs text-slate-500">
          <span>Won: <span className="font-semibold text-emerald-600">₹{((summary.wonDealValue || 0) / 100000).toFixed(1)}L</span></span>
          <span>Closed Deals: <span className="font-semibold text-blue-600">{summary.closedWonCount ?? 0}</span></span>
          <span>Lost: <span className="font-semibold text-red-500">{summary.closedLostCount ?? 0}</span></span>
        </div>
      </GlassCard>

      <DataTable
        title="Commission Ledger"
        columns={columns}
        data={commissions as Record<string, unknown>[]}
        loading={loading}
        searchPlaceholder="Search recruiter or period..."
        exportFileName="recruiter-commissions"
        emptyMessage="No commission records found."
      />
    </div>
  );
}
