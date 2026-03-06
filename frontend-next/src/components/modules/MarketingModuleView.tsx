'use client';

import { useMemo } from 'react';
import { Megaphone, MessagesSquare, Rocket, Target } from 'lucide-react';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { crmLeadRecords, marketingCampaignRecords, marketingChannelPerformance } from '@/services/platform-data';
import type { CrmLeadApiRecord, MarketingCampaignApiRecord } from '@/services/api/platform-api';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency, formatPercent } from '@/utils/formatters';

const campaignTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
  const normalized = status.toLowerCase();

  if (normalized.includes('running')) return 'success';
  if (normalized.includes('scheduled')) return 'warning';
  if (normalized.includes('paused')) return 'danger';
  return 'default';
};

export function MarketingModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [campaigns, performance] = await Promise.all([
        platformApi.getMarketingCampaigns(),
        platformApi.getMarketingPerformance(),
      ]);

      let crmLeads: Awaited<ReturnType<typeof platformApi.getCrmLeads>> = [];
      try {
        crmLeads = await platformApi.getCrmLeads();
      } catch {
        crmLeads = [];
      }

      return {
        campaigns,
        performance,
        crmLeads,
      };
    },
    fallback: {
      campaigns: marketingCampaignRecords,
      performance: marketingChannelPerformance,
      crmLeads: crmLeadRecords,
    },
  });

  const campaigns = data.campaigns as MarketingCampaignApiRecord[];
  const crmLeads = data.crmLeads as CrmLeadApiRecord[];

  const totals = useMemo(() => {
    const totalReach = campaigns.reduce((sum, row) => sum + row.reach, 0);
    const totalConversions = campaigns.reduce((sum, row) => sum + row.conversions, 0);
    const totalSpend = campaigns.reduce((sum, row) => sum + row.spend, 0);

    return {
      totalReach,
      totalConversions,
      totalSpend,
      conversionRate: totalReach > 0 ? (totalConversions / totalReach) * 100 : 0,
    };
  }, [campaigns]);

  const conversionByCampaign = useMemo(
    () =>
      campaigns.map((campaign) => ({
        name: campaign.campaignName.split(' ').slice(0, 2).join(' '),
        value: campaign.conversions,
      })),
    [campaigns],
  );

  const reachTrend = useMemo(
    () =>
      campaigns.map((campaign) => ({
        name: campaign.campaignName.split(' ').slice(0, 2).join(' '),
        value: campaign.reach,
      })),
    [campaigns],
  );

  const liveNurtureLeads = useMemo(
    () => crmLeads.filter((lead) => lead.stage.toLowerCase().includes('proposal') || lead.stage.toLowerCase().includes('negotiation')).length,
    [crmLeads],
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Marketing Automation"
        description="Execute multi-channel campaigns, track conversions, and sync demand generation with CRM and sales pipelines."
      />

      <ModuleLinksBar
        links={[
          { label: 'CRM', href: `/crm?role=${activeRole}` },
          { label: 'Sales', href: `/sales?role=${activeRole}` },
          { label: 'Finance', href: `/finance?role=${activeRole}` },
          { label: 'Analytics', href: `/analytics?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Active Campaigns</p>
            <Megaphone size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{campaigns.filter((row) => row.status.toLowerCase().includes('running')).length}</p>
          <p className="mt-1 text-xs text-slate-500">Email, SMS, and WhatsApp orchestration</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Total Reach</p>
            <Rocket size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{totals.totalReach.toLocaleString('en-US')}</p>
          <p className="mt-1 text-xs text-slate-500">Audience delivery in current cycle</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Conversion Rate</p>
            <Target size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{formatPercent(totals.conversionRate)}</p>
          <p className="mt-1 text-xs text-slate-500">Attribution linked to deal outcomes</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Pipeline Leads</p>
            <MessagesSquare size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{liveNurtureLeads}</p>
          <p className="mt-1 text-xs text-slate-500">CRM-qualified leads in active nurture stage</p>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DonutChartCard title="Channel Performance Mix" data={data.performance} />
        <StackedBarChart title="Campaign Conversions" data={conversionByCampaign} mode="single" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <TrendAreaChart title="Reach Trend by Campaign" data={reachTrend} color="#1f6feb" />
        <GlassCard className="space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Marketing Spend Snapshot</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totals.totalSpend)}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Campaign spends are synced with Finance for budget checks and with Sales for CAC monitoring.
          </p>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>CRM lead stage decides nurturing sequence priority.</p>
            <p>Closed-won attribution feeds next campaign optimization.</p>
            <p>Budget guardrails trigger alerts in automation center.</p>
          </div>
        </GlassCard>
      </section>

      <section>
        <GlassCard className="space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Campaign Operations</p>
          <SimpleTable
            rows={campaigns}
            columns={[
              { key: 'campaignName', label: 'Campaign' },
              { key: 'channel', label: 'Channel' },
              {
                key: 'status',
                label: 'Status',
                render: (campaign) => <StatusPill label={campaign.status} tone={campaignTone(campaign.status)} />,
              },
              {
                key: 'audienceSize',
                label: 'Audience',
                render: (campaign) => campaign.audienceSize.toLocaleString('en-US'),
              },
              {
                key: 'reach',
                label: 'Reach',
                render: (campaign) => campaign.reach.toLocaleString('en-US'),
              },
              { key: 'conversions', label: 'Conversions' },
              {
                key: 'spend',
                label: 'Spend',
                render: (campaign) => formatCurrency(campaign.spend),
              },
            ]}
          />
        </GlassCard>
      </section>
    </div>
  );
}
