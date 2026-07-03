'use client';

import { useState } from 'react';
import { Calendar, Video, CheckCircle2, XCircle, Clock, Plus } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, ModalSelect, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useRecruitmentApplications, useRecruitmentJobs } from '@/hooks/useDomainData';

type InterviewRow = { id: string; candidateId: string; jobTitle: string; stage: string; score: number | null; status: string; scheduledAt: string };

export function InterviewsModuleView() {
 const { applications, loading } = useRecruitmentApplications();
 const { jobs } = useRecruitmentJobs();
 const [modalOpen, setModalOpen] = useState(false);

 const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.title]));

 const interviewStages = ['Interview', 'Technical', 'HR Round', 'Shortlisted'];
 const interviews: InterviewRow[] = applications
 .filter((a) => interviewStages.includes(a.stage))
 .map((a) => ({
 id: a.id,
 candidateId: a.candidateId,
 jobTitle: jobMap[a.jobId] ?? a.jobId,
 stage: a.stage,
 score: a.score ?? null,
 status: a.status,
 scheduledAt: new Date(a.updatedAt ?? a.createdAt).toLocaleDateString('en-IN'),
 }));

 const scheduled = interviews.length;
 const completed = interviews.filter((i) => i.status === 'Active').length;
 const pending = interviews.filter((i) => !i.score).length;

 const columns: ColumnDef<InterviewRow>[] = [
 { key: 'candidateId', label: 'Candidate', sortable: true },
 { key: 'jobTitle', label: 'Position', sortable: true },
 { key: 'stage', label: 'Round', sortable: true, render: (v) => <StatusPill label={v as string} /> },
 { key: 'scheduledAt', label: 'Date', sortable: true },
 { key: 'score', label: 'Score', sortable: true, render: (v) => v !== null ? <span className="font-semibold text-blue-600">{String(v)}%</span> : <span className="text-slate-500 text-xs">Pending</span> },
 { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusPill label={v as string} /> },
 ];

 return (
 <div className="space-y-5 animate-rise">
 <PageTitle title="Interviews" description="Schedule and track candidate interviews across rounds." />
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {[
 { label: 'Scheduled', value: scheduled, icon: <Calendar className="h-4 w-4 text-blue-500" /> },
 { label: 'In Progress', value: completed, icon: <Video className="h-4 w-4 text-violet-500" /> },
 { label: 'Pending Feedback', value: pending, icon: <Clock className="h-4 w-4 text-amber-500" /> },
 { label: 'Pass Rate', value: `${scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0}%`, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
 ].map((s) => (
 <GlassCard key={s.label}>
 <div className="flex items-start justify-between">
 <div><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-slate-900 ">{s.value}</p></div>
 <span className="p-2 rounded-xl bg-slate-100 ">{s.icon}</span>
 </div>
 </GlassCard>
 ))}
 </section>
 <DataTable
 title="Interview Schedule"
 columns={columns}
 data={interviews}
 loading={loading}
 searchPlaceholder="Search candidate or position..."
 exportFileName="interviews"
 emptyMessage="No interviews scheduled. Move candidates to interview stage."
 actions={<PrimaryButton onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Schedule Interview</PrimaryButton>}
 />
 <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Interview"
 footer={<><SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton onClick={() => setModalOpen(false)}>Schedule</PrimaryButton></>}>
 <div className="space-y-4">
 <FieldGroup label="Candidate ID" required><ModalInput placeholder="Enter candidate ID..." /></FieldGroup>
 <FieldGroup label="Interview Round"><ModalSelect><option>Technical</option><option>HR Round</option><option>Final Round</option></ModalSelect></FieldGroup>
 <FieldGroup label="Date & Time" required><ModalInput type="datetime-local" /></FieldGroup>
 <FieldGroup label="Interviewer"><ModalInput placeholder="Interviewer name..." /></FieldGroup>
 </div>
 </FormModal>
 </div>
 );
}
