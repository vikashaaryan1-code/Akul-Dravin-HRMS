'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { payrollSummary, monthlyPayrollTrend } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency } from '@/utils/formatters';

export function PayrollModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const rows = await platformApi.getPayroll();
      let commissionRows: Awaited<ReturnType<typeof platformApi.getSalesCommissions>> = [];

      try {
        commissionRows = await platformApi.getSalesCommissions();
      } catch {
        commissionRows = [];
      }

      return {
        payrollRows: rows,
        commissionRows,
      };
    },
    fallback: {
      payrollRows: [],
      commissionRows: [],
    },
  });

  const computed = useMemo(() => {
    if (!isLive || data.payrollRows.length === 0) {
      return {
        payout: 851000,
        totalGross: 720000,
        targetBonus: 124000,
        daysWiseSalary: 638000,
        breakdown: payrollSummary,
        trend: monthlyPayrollTrend,
      };
    }

    const payout = data.payrollRows.reduce((sum, row) => sum + Number(row.netPay), 0);
    const totalGross = data.payrollRows.reduce((sum, row) => sum + Number(row.grossPay), 0);
    const totalDeductions = data.payrollRows.reduce((sum, row) => sum + Number(row.deductions), 0);
    const targetBonus = data.commissionRows.reduce((sum, row) => sum + Number(row.calculatedCommission), 0);

    const byMonth = new Map<string, number>();
    data.payrollRows.forEach((row) => {
      byMonth.set(row.payrollMonth, (byMonth.get(row.payrollMonth) ?? 0) + Number(row.netPay));
    });

    const trend = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({
        name: month,
        value: Number(value.toFixed(2)),
      }));

    return {
      payout,
      totalGross,
      targetBonus,
      daysWiseSalary: Math.max(0, totalGross - totalDeductions),
      breakdown: [
        { name: 'Gross Pay', value: Number(totalGross.toFixed(2)) },
        { name: 'Deductions', value: Number(totalDeductions.toFixed(2)) },
        { name: 'Net Pay', value: Number(payout.toFixed(2)) },
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
          { label: 'Attendance', href: `/attendance?role=${activeRole}` },
          { label: 'Employees', href: `/employees?role=${activeRole}` },
          { label: 'Sales Commission', href: `/sales?role=${activeRole}` },
          { label: 'Documents', href: `/documents?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Monthly Payroll Summary</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(computed.payout)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Salary Calculations</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(computed.totalGross)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Target-Based Bonus</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(computed.targetBonus)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Days-Wise Salary</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(computed.daysWiseSalary)}</p>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DonutChartCard title="Salary Breakdown" data={computed.breakdown} />
        <TrendAreaChart title="Monthly Payroll Trend" data={computed.trend} color="#E85A2A" />
      </section>

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
