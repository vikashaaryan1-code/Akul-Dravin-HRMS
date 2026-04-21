'use client';

import { useMemo, useState } from 'react';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApiResource } from '@/hooks/useApiResource';
import {
  platformApi,
  type AlertApiRecord,
  type DocumentApiRecord,
  type WorkflowApiRecord,
} from '@/services/api/platform-api';
import { useUIStore } from '@/store/ui-store';

type WorkflowStep = {
  code: string;
  label: string;
  owner: string;
  slaHours: number;
  output: string;
};

type InternshipPayload = {
  workflowReference?: string;
  certificateNumber?: string;
  verificationCode?: string;
  internName?: string;
  internshipRole?: string;
  department?: string;
  university?: string;
  mentorName?: string;
  startDate?: string;
  endDate?: string;
  stipend?: string;
  projectTitle?: string;
  projectSummary?: string;
};

type AutomationDashboardData = {
  workflows: WorkflowApiRecord[];
  alerts: AlertApiRecord[];
  documents: DocumentApiRecord[];
};

const defaultInternshipPayload: Record<string, unknown> = {
  internName: 'Aarav Sharma',
  candidateEmail: 'aarav.sharma@example.com',
  internshipRole: 'Frontend Engineering Intern',
  department: 'Product Engineering',
  university: 'IIT Patna',
  mentorName: 'Ruchi Malhotra',
  startDate: '2026-01-13',
  endDate: '2026-04-13',
  stipend: 'INR 18,000 per month',
  projectTitle: 'HRMS Workflow Hub',
  projectSummary: 'Automated internship packet preparation, review routing, and certificate dispatch.',
  projectHighlights: ['Prepared approval-ready packet', 'Generated certificate metadata', 'Drafted experience letter for review'],
  skillHighlights: ['Workflow automation', 'Documentation quality', 'Operations visibility'],
  approverName: 'Kavya Bansal',
};

const formatDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Pending';

const workflowTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
  const normalized = status.toLowerCase();

  if (normalized.includes('active') || normalized.includes('ready') || normalized.includes('low')) return 'success';
  if (normalized.includes('paused') || normalized.includes('draft') || normalized.includes('medium')) return 'warning';
  if (normalized.includes('failed') || normalized.includes('error') || normalized.includes('high')) return 'danger';
  return 'default';
};

const getWorkflowSteps = (workflow?: WorkflowApiRecord | null): WorkflowStep[] => {
  const rawSteps = workflow?.workflowConfig?.steps;

  if (!Array.isArray(rawSteps)) {
    return [];
  }

  return rawSteps
    .filter((step): step is Record<string, unknown> => typeof step === 'object' && step !== null)
    .map((step, index) => ({
      code: typeof step.code === 'string' ? step.code : `step-${index + 1}`,
      label: typeof step.label === 'string' ? step.label : `Step ${index + 1}`,
      owner: typeof step.owner === 'string' ? step.owner : 'Automation Desk',
      slaHours: typeof step.slaHours === 'number' ? step.slaHours : Number(step.slaHours) || 0,
      output: typeof step.output === 'string' ? step.output : 'Workflow output',
    }));
};

const getInternshipPayload = (document?: DocumentApiRecord | null): InternshipPayload | null => {
  if (!document || typeof document.documentPayload !== 'object' || document.documentPayload === null) {
    return null;
  }

  return document.documentPayload as InternshipPayload;
};

export function AutomationModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data, isLive, loading, error, refresh } = useApiResource<AutomationDashboardData>({
    loader: async () => {
      const [workflows, alerts, documents] = await Promise.all([
        platformApi.getWorkflows(),
        platformApi.getAutomationAlerts(),
        platformApi.getDocuments(),
      ]);

      return {
        workflows,
        alerts,
        documents,
      };
    },
    fallback: {
      workflows: [],
      alerts: [],
      documents: [],
    },
  });

  const internshipWorkflow = useMemo(
    () => data.workflows.find((workflow) => workflow.workflowCode === 'internship-certificate-automation') ?? null,
    [data.workflows],
  );
  const workflowSteps = useMemo(() => getWorkflowSteps(internshipWorkflow), [internshipWorkflow]);
  const latestPacketDocument = useMemo(
    () =>
      data.documents.find(
        (document) =>
          document.documentType.toLowerCase().includes('certificate') &&
          Boolean(getInternshipPayload(document)?.internName),
      ) ?? null,
    [data.documents],
  );
  const latestPacket = getInternshipPayload(latestPacketDocument);

  const stateCards = useMemo(
    () => [
      { stage: 'Auto Workflows', count: data.workflows.length },
      { stage: 'Active Workflows', count: data.workflows.filter((item) => item.status.toLowerCase().includes('active')).length },
      { stage: 'System Alerts', count: data.alerts.length },
      { stage: 'Generated Docs', count: data.documents.filter((item) => Boolean(getInternshipPayload(item)?.workflowReference)).length },
    ],
    [data.alerts.length, data.documents, data.workflows],
  );

  const runInternshipWorkflow = async () => {
    if (!internshipWorkflow) {
      setMessage('Internship certificate workflow is not available yet.');
      return;
    }

    setRunning(true);
    setMessage(null);

    try {
      const result = await platformApi.triggerWorkflow(internshipWorkflow.id, {
        triggerReason: 'manual internship automation run',
        payload: defaultInternshipPayload,
      });
      await refresh();
      setMessage(`Workflow run complete. ${result.documents.length} documents were generated for ${String(result.workflowSummary.internName ?? 'the intern')}.`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Unable to trigger the workflow.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle
        title="Automation Dashboard"
        description="Track the internship certificate workflow live, run it on demand, and keep the generated packet details visible to HR."
        actions={
          <button
            type="button"
            onClick={() => void runInternshipWorkflow()}
            disabled={running || loading}
            className="rounded-md bg-ink px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? 'Running...' : 'Run Internship Workflow'}
          </button>
        }
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

      {message ? (
        <p className="rounded-lg border border-aqua/30 bg-aqua/10 px-4 py-3 text-sm text-aqua dark:border-aqua/40">
          {message}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stateCards.map((item) => (
          <GlassCard key={item.stage}>
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">{item.stage}</p>
            <p className="mt-2 text-2xl font-semibold">{item.count}</p>
          </GlassCard>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Internship Certificate Lane</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {internshipWorkflow
                  ? `${internshipWorkflow.name} runs through document generation, approval, and dispatch.`
                  : 'The live internship workflow will appear here once the backend module is active.'}
              </p>
            </div>
            {internshipWorkflow ? <StatusPill label={internshipWorkflow.status} tone={workflowTone(internshipWorkflow.status)} /> : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Trigger Type</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{internshipWorkflow?.triggerType ?? 'manual-or-completion'}</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Success Rate</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{internshipWorkflow?.successRate ?? '0.00'}%</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Run Count</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{internshipWorkflow?.runCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Last Run</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(internshipWorkflow?.lastRunAt)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200/80 bg-white/70 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Latest Packet</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Intern</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{latestPacket?.internName ?? 'Ready for next run'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">University</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{latestPacket?.university ?? 'Not generated yet'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Certificate No.</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{latestPacket?.certificateNumber ?? 'Generated during completion step'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Verification</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{latestPacket?.verificationCode ?? 'Assigned during sign-off'}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {latestPacket?.projectSummary ?? 'Run the workflow to create a packet with project summary, skill highlights, and approval metadata.'}
            </p>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Workflow Stages</p>
          <div className="mt-4 space-y-3">
            {workflowSteps.length > 0 ? workflowSteps.map((step) => (
              <div key={step.code} className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{step.label}</p>
                  <span className="text-xs uppercase tracking-[0.12em] text-slate-500">{step.slaHours}h SLA</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Owner: {step.owner}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.output}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">Workflow stages will appear here when the live config is loaded.</p>
            )}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard>
          <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Workflow Registry</p>
          <SimpleTable
            rows={data.workflows}
            columns={[
              { key: 'name', label: 'Workflow' },
              { key: 'module', label: 'Module' },
              { key: 'triggerType', label: 'Trigger' },
              { key: 'runCount', label: 'Runs' },
              { key: 'successRate', label: 'Success' },
              {
                key: 'status',
                label: 'Status',
                render: (row) => <StatusPill label={row.status} tone={workflowTone(row.status)} />,
              },
            ]}
          />
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Alert Feed</p>
          <div className="mt-4 space-y-3">
            {data.alerts.length > 0 ? data.alerts.map((alert) => (
              <div key={alert.code} className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{alert.code}</p>
                  <StatusPill label={alert.severity} tone={workflowTone(alert.severity)} />
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{alert.message}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">Alerts will appear here when the automation service returns live telemetry.</p>
            )}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
