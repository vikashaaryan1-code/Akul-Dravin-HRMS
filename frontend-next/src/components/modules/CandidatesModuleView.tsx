'use client';

import { useState } from 'react';
import { Users2, FileText, Clock, CheckCircle2, Plus, UserCheck } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, ModalSelect, ModalTextarea, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useRecruitmentApplications, useRecruitmentJobs } from '@/hooks/useDomainData';
import type { RecruitmentApplicationApiRecord } from '@/services/api/platform-api';

export function CandidatesModuleView() {
 const { applications, loading } = useRecruitmentApplications();
 const { jobs } = useRecruitmentJobs();
 const [modalOpen, setModalOpen] = useState(false);
 const [form, setForm] = useState({ jobId: '', candidateId: '', stage: 'Applied' });

 const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.title]));

 const total = applications.length;
 const shortlisted = applications.filter((a) => a.stage === 'Shortlisted').length;
 const interviewed = applications.filter((a) => ['Interview', 'Technical', 'HR Round'].includes(a.stage)).length;
 const offered = applications.filter((a) => a.stage === 'Offer').length;

 const columns: ColumnDef<RecruitmentApplicationApiRecord>[] = [
 { key: 'candidateId', label: 'Candidate ID', sortable: true },
 { key: 'jobId', label: 'Applied For', sortable: false, render: (v) => jobMap[v as string] ?? (v as string) },
 { key: 'stage', label: 'Stage', sortable: true, render: (v) => <StatusPill label={v as string} /> },
 { key: 'score', label: 'Score', sortable: true, render: (v) => v ? <span className="font-semibold">{String(v)}%</span> : '—' },
 { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusPill label={v as string} /> },
 ];

 return (
 <div className="space-y-5 animate-rise">
 <PageTitle title="Candidates" description="Track candidate pipeline across all job openings." />
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {[
 { label: 'Total Candidates', value: total, icon: <Users2 className="h-4 w-4 text-blue-500" /> },
 { label: 'Shortlisted', value: shortlisted, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
 { label: 'In Interview', value: interviewed, icon: <Clock className="h-4 w-4 text-amber-500" /> },
 { label: 'Offer Stage', value: offered, icon: <UserCheck className="h-4 w-4 text-violet-500" /> },
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
 title="All Candidates"
 columns={columns}
 data={applications}
 loading={loading}
 searchPlaceholder="Search candidate..."
 exportFileName="candidates"
 emptyMessage="No candidates found. Add job applications to see candidates here."
 actions={<PrimaryButton onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Add Candidate</PrimaryButton>}
 />
 <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Candidate Application"
 subtitle="Create a new application for a job opening"
 footer={<><SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton onClick={() => setModalOpen(false)}>Submit</PrimaryButton></>}>
 <div className="space-y-4">
 <FieldGroup label="Candidate ID / Email" required><ModalInput placeholder="e.g. candidate@email.com" value={form.candidateId} onChange={e => setForm({...form, candidateId: e.target.value})} /></FieldGroup>
 <FieldGroup label="Job Opening" required>
 <ModalSelect value={form.jobId} onChange={e => setForm({...form, jobId: e.target.value})}>
 <option value="">Select job...</option>
 {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
 </ModalSelect>
 </FieldGroup>
 <FieldGroup label="Initial Stage">
 <ModalSelect value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
 {['Applied','Screening','Shortlisted','Interview','Technical','HR Round','Offer','Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
 </ModalSelect>
 </FieldGroup>
 </div>
 </FormModal>
 </div>
 );
}
