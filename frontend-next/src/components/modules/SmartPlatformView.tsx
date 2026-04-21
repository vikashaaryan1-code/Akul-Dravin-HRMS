'use client';

import { useMemo } from 'react';
import { CheckCircle2, Rocket, ShieldCheck, TimerReset } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { platformApi, type SmartPlatformReadinessApiRecord } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';

const fallbackReadiness: SmartPlatformReadinessApiRecord = {
  product: 'AKUL DRAVIN HRMS SaaS',
  releaseTrack: 'Smart MVP',
  readinessLabel: 'Paid-user MVP scope locked',
  paidUserReady: true,
  stabilityFocus: [
    'Full HRMS workflows first',
    'Lite CRM and Finance without enterprise bloat',
    'Basic marketplace listings and routing',
    'Core deterministic AI scores before advanced model orchestration',
  ],
  modules: [
    {
      id: 'hrms',
      name: 'HRMS',
      scope: 'full',
      status: 'ready',
      completionPercent: 100,
      summary: 'Primary paid product with employees, attendance, leave, payroll, documents, performance, workflow, and notifications.',
      functionalWorkflows: ['Employee management', 'Attendance and leave', 'Payroll calculations', 'Documents and services'],
      intentionallyDeferred: ['Advanced statutory payroll packs', 'Complex workforce simulation'],
    },
    {
      id: 'crm',
      name: 'CRM',
      scope: 'lite',
      status: 'operational',
      completionPercent: 80,
      summary: 'Lite sales relationship module for leads, customers, interactions, and stage updates.',
      functionalWorkflows: ['Lead list', 'Lead capture', 'Customer accounts', 'Interaction timeline'],
      intentionallyDeferred: ['CPQ', 'Territory planning', 'Contract lifecycle'],
    },
    {
      id: 'finance',
      name: 'Finance',
      scope: 'lite',
      status: 'operational',
      completionPercent: 78,
      summary: 'Lite finance module for invoices, expenses, receivables, GST/tax summary, and margin.',
      functionalWorkflows: ['Invoice ledger', 'Expense ledger', 'Finance summary', 'Invoice status updates'],
      intentionallyDeferred: ['Double-entry accounting', 'Bank reconciliation', 'Advanced tax filing'],
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      scope: 'basic',
      status: 'operational',
      completionPercent: 75,
      summary: 'Basic working marketplace for public jobs and recruiter/recruitment handoff.',
      functionalWorkflows: ['Browse jobs', 'Search jobs', 'Protected job updates'],
      intentionallyDeferred: ['Escrow payouts', 'Bidding engine'],
    },
    {
      id: 'ai',
      name: 'AI',
      scope: 'core',
      status: 'guarded',
      completionPercent: 72,
      summary: 'Core AI endpoints for candidate match, attrition risk, salary forecast, and recommendations.',
      functionalWorkflows: ['Candidate match', 'Attrition risk', 'Salary forecast', 'Recommendations'],
      intentionallyDeferred: ['Autonomous decisions', 'Advanced model registry UI'],
    },
  ],
  launchChecklist: [
    { item: 'Role-based navigation available', done: true },
    { item: 'Demo login and fallback mode available', done: true },
    { item: 'HRMS paid-user workflows prioritized', done: true },
    { item: 'CRM/Finance kept lite by design', done: true },
    { item: 'Marketplace and AI constrained to core flows', done: true },
  ],
};

const scopeTone = (scope: string): 'default' | 'success' | 'warning' => {
  if (scope === 'full') return 'success';
  if (scope === 'lite' || scope === 'basic') return 'warning';
  return 'default';
};

export function SmartPlatformView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: platformApi.getSmartPlatformReadiness,
    fallback: fallbackReadiness,
  });

  const averageCompletion = useMemo(() => {
    const total = data.modules.reduce((sum, item) => sum + item.completionPercent, 0);
    return Math.round(total / Math.max(1, data.modules.length));
  }, [data.modules]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Smart Platform Build"
        description="Paid-user MVP scope: full HRMS, lite CRM/Finance, basic marketplace, and core AI only."
      />

      <ModuleLinksBar
        links={[
          { label: 'HRMS', href: `/employees?role=${activeRole}` },
          { label: 'CRM Lite', href: `/crm?role=${activeRole}` },
          { label: 'Finance Lite', href: `/finance?role=${activeRole}` },
          { label: 'Marketplace', href: `/marketplace?role=${activeRole}` },
          { label: 'AI Hub', href: `/ai-hub?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Release Track</p>
            <Rocket size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{data.releaseTrack}</p>
          <p className="mt-1 text-xs text-slate-500">{data.readinessLabel}</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Paid Users</p>
            <ShieldCheck size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{data.paidUserReady ? 'Ready' : 'Blocked'}</p>
          <p className="mt-1 text-xs text-slate-500">MVP module scope is stable</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Module Completion</p>
            <TimerReset size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{averageCompletion}%</p>
          <p className="mt-1 text-xs text-slate-500">Average across scoped modules</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Scope Control</p>
            <CheckCircle2 size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">Locked</p>
          <p className="mt-1 text-xs text-slate-500">No enterprise overbuild in MVP</p>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          {data.modules.map((item) => (
            <GlassCard key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.status}</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={item.scope} tone={scopeTone(item.scope)} />
                  <StatusPill label={`${item.completionPercent}%`} tone={item.completionPercent >= 90 ? 'success' : 'warning'} />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.summary}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Functional Now</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {item.functionalWorkflows.map((workflow) => (
                      <li key={workflow}>- {workflow}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Not In MVP</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {item.intentionallyDeferred.map((deferred) => (
                      <li key={deferred}>- {deferred}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="space-y-4">
          <GlassCard>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Stability Focus</p>
            <div className="mt-3 space-y-2">
              {data.stabilityFocus.map((item) => (
                <div key={item} className="rounded-xl border border-slate-200/70 bg-white/70 p-3 text-sm text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Launch Checklist</p>
            <div className="mt-3 space-y-2">
              {data.launchChecklist.map((item) => (
                <div key={item.item} className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  <span>{item.item}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
