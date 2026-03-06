'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { candidateRecords, jobPostings } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import type { CandidateRecord, JobPosting } from '@/types/platform';

const toTitleCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const toCandidateStage = (stage: string): CandidateRecord['stage'] => {
  const normalized = stage.toLowerCase();
  if (normalized.includes('offer')) return 'Offer';
  if (normalized.includes('interview')) return 'Interview';
  if (normalized.includes('hired')) return 'Hired';
  return 'Screening';
};

const toJobStatus = (status: string): JobPosting['status'] => {
  const normalized = status.toLowerCase();
  if (normalized.includes('close')) return 'Closed';
  if (normalized.includes('interview')) return 'Interviewing';
  return 'Open';
};

export function RecruitmentModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [jobs, applications] = await Promise.all([
        platformApi.getRecruitmentJobs(),
        platformApi.getRecruitmentApplications(),
      ]);

      const mappedJobs: JobPosting[] = jobs.map((job, index) => ({
        id: job.requisitionCode || job.id,
        title: job.title,
        department: toTitleCase(job.employmentType || 'General'),
        openings: Math.max(1, Math.min(8, (index % 5) + 1)),
        status: toJobStatus(job.status),
      }));

      const mappedCandidates: CandidateRecord[] = applications.slice(0, 10).map((application) => ({
        id: application.id,
        name: `Candidate ${application.candidateId.slice(0, 6)}`,
        role: mappedJobs.find((job) => job.id === application.jobId)?.title ?? 'Applied Role',
        match: application.score ? Number(application.score) : 78,
        stage: toCandidateStage(application.stage),
      }));

      return {
        jobs: mappedJobs,
        candidates: mappedCandidates,
      };
    },
    fallback: {
      jobs: jobPostings,
      candidates: candidateRecords,
    },
  });

  const interviewPipeline = useMemo(() => {
    const source = data.candidates;

    const screening = source.filter((candidate) => candidate.stage === 'Screening').length;
    const interview = source.filter((candidate) => candidate.stage === 'Interview').length;
    const offer = source.filter((candidate) => candidate.stage === 'Offer').length;
    const hired = source.filter((candidate) => candidate.stage === 'Hired').length;

    return [
      { name: 'Screening', value: screening || 1 },
      { name: 'Interview', value: interview || 1 },
      { name: 'Offer', value: offer || 1 },
      { name: 'Hired', value: hired || 1 },
    ];
  }, [data.candidates]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Recruitment Dashboard"
        description="Manage job postings, candidate profiles, interview pipelines, and offer conversion from one console."
      />

      <ModuleLinksBar
        links={[
          { label: 'Marketplace', href: `/marketplace?role=${activeRole}` },
          { label: 'Sales Pipeline', href: `/sales?role=${activeRole}` },
          { label: 'Employees', href: `/employees?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Job Postings</p>
          <p className="mt-2 text-2xl font-semibold">{data.jobs.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Candidate Profiles</p>
          <p className="mt-2 text-2xl font-semibold">{data.candidates.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Interview Pipelines</p>
          <p className="mt-2 text-2xl font-semibold">{interviewPipeline.reduce((sum, item) => sum + item.value, 0)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Offer Management</p>
          <p className="mt-2 text-2xl font-semibold">
            {((interviewPipeline.find((item) => item.name === 'Hired')?.value ?? 0) * 100 / Math.max(1, data.candidates.length)).toFixed(0)}% hired
          </p>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StackedBarChart title="Interview Pipeline" data={interviewPipeline} mode="single" />
        <GlassCard>
          <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Candidate Profile Highlights</p>
          <div className="space-y-2">
            {data.candidates.slice(0, 6).map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-xl border border-slate-200/70 bg-white/80 p-3 dark:border-slate-700/70 dark:bg-slate-800/70"
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{candidate.name}</p>
                <p className="text-xs text-slate-500">{candidate.role}</p>
                <div className="mt-2 flex items-center justify-between">
                  <StatusPill label={`${candidate.match}% match`} tone={candidate.match >= 90 ? 'success' : 'warning'} />
                  <StatusPill label={candidate.stage} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section>
        <SimpleTable
          rows={data.jobs}
          columns={[
            { key: 'id', label: 'Job ID' },
            { key: 'title', label: 'Role' },
            { key: 'department', label: 'Department' },
            { key: 'openings', label: 'Openings' },
            {
              key: 'status',
              label: 'Status',
              render: (job) => (
                <StatusPill
                  label={job.status}
                  tone={job.status === 'Open' ? 'success' : job.status === 'Interviewing' ? 'warning' : 'default'}
                />
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
