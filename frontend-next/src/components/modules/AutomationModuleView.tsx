'use client';

import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { InsightListCard } from '@/components/modules/InsightListCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { automationState } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';

export function AutomationModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [workflows, alerts] = await Promise.all([
        platformApi.getWorkflows(),
        platformApi.getAutomationAlerts(),
      ]);

      return {
        workflows,
        alerts,
      };
    },
    fallback: {
      workflows: [],
      alerts: [],
    },
  });

  const stateCards = isLive && data.workflows.length > 0
    ? [
        { stage: 'Auto Workflows', count: data.workflows.length },
        { stage: 'Active Workflows', count: data.workflows.filter((item) => item.status.toLowerCase().includes('active')).length },
        { stage: 'System Alerts', count: data.alerts.length },
        { stage: 'Total Runs', count: data.workflows.reduce((sum, item) => sum + item.runCount, 0) },
      ]
    : automationState;

  const automationInsights = isLive && data.alerts.length > 0
    ? data.alerts.map((alert) => `${alert.code} (${alert.severity}): ${alert.message}`)
    : [
        'Recruitment workflow latency improved by 28% after model tuning.',
        'Document generation backlog dropped to near-zero in the last 24 hours.',
        'Payroll discrepancy alerts auto-resolved in 82% of flagged cases.',
        'AI recommendation confidence score increased to 0.91.',
      ];

  return (
    <div className="space-y-5">
      <PageTitle
        title="Automation Dashboard"
        description="Monitor auto workflows, triggered documents, system alerts, and AI recommendations in real time."
      />

      <ModuleLinksBar
        links={[
          { label: 'Documents', href: `/documents?role=${activeRole}` },
          { label: 'Services', href: `/services?role=${activeRole}` },
          { label: 'Analytics', href: `/analytics?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stateCards.map((item) => (
          <GlassCard key={item.stage}>
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">{item.stage}</p>
            <p className="mt-2 text-2xl font-semibold">{item.count}</p>
          </GlassCard>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <StackedBarChart
          title="Automation Monitoring"
          data={stateCards.map((item) => ({ name: item.stage, value: item.count }))}
          mode="single"
        />
        <InsightListCard title="AI Recommendations" items={automationInsights} />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Workflow Queue Health</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{isLive ? 'Backend workflows connected with live run counters.' : '97.8% workflow success rate with retry orchestration enabled.'}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Document Triggers</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Offer letters, salary slips, and certificates auto-generated with SLA tracking.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">System Alerts</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Critical alerts are routed to role-specific channels in under 30 seconds.</p>
        </GlassCard>
      </section>
    </div>
  );
}
