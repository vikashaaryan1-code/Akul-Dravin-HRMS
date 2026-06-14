'use client';

import { useState } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, Plus, ExternalLink, Eye } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, ModalSelect, ModalTextarea, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useMarketplaceJobs } from '@/hooks/useDomainData';

type JobRow = { id: string; title: string; company: string; location: string; type: string; salaryRange: string; status: string; applications: number; postedAt: string };

export function JobBoardModuleView() {
  const { jobs, loading, refresh } = useMarketplaceJobs();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', location: '', type: 'Full-time', salaryMin: '', salaryMax: '' });

  const rows: JobRow[] = jobs.map((j: any) => ({
    id: j.id,
    title: j.title,
    company: j.company ?? j.postedBy ?? 'Akul Dravin',
    location: j.location ?? 'Remote',
    type: j.type ?? j.employmentType ?? 'Full-time',
    salaryRange: j.salaryMin && j.salaryMax ? `₹${(j.salaryMin / 100000).toFixed(1)}L – ₹${(j.salaryMax / 100000).toFixed(1)}L` : '—',
    status: j.status ?? 'Active',
    applications: j.applicationCount ?? 0,
    postedAt: j.createdAt ? new Date(j.createdAt).toLocaleDateString('en-IN') : '—',
  }));

  const activeJobs = rows.filter((r) => r.status === 'Active').length;
  const totalApplications = rows.reduce((s, r) => s + r.applications, 0);

  const columns: ColumnDef<JobRow>[] = [
    { key: 'title', label: 'Position', sortable: true },
    { key: 'company', label: 'Company', sortable: true },
    { key: 'location', label: 'Location', sortable: true, render: (v) => <span className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3 text-slate-400" />{v as string}</span> },
    { key: 'type', label: 'Type', sortable: true, render: (v) => <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">{v as string}</span> },
    { key: 'salaryRange', label: 'Salary', sortable: false },
    { key: 'applications', label: 'Applications', sortable: true, render: (v) => <span className="font-semibold text-violet-600">{v as number}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusPill label={v as string} /> },
  ];

  return (
    <div className="space-y-5 animate-rise">
      <PageTitle title="Job Board" description="Manage public job listings and track applications across all openings." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active Postings', value: activeJobs, icon: <Briefcase className="h-4 w-4 text-blue-500" /> },
          { label: 'Total Postings', value: rows.length, icon: <Eye className="h-4 w-4 text-violet-500" /> },
          { label: 'Total Applications', value: totalApplications, icon: <Clock className="h-4 w-4 text-amber-500" /> },
          { label: 'Avg Applications/Job', value: rows.length > 0 ? Math.round(totalApplications / rows.length) : 0, icon: <DollarSign className="h-4 w-4 text-emerald-500" /> },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p></div>
              <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">{s.icon}</span>
            </div>
          </GlassCard>
        ))}
      </section>
      <DataTable
        title="All Job Listings"
        columns={columns}
        data={rows}
        loading={loading}
        searchPlaceholder="Search jobs..."
        exportFileName="job-board"
        emptyMessage="No jobs posted yet. Create your first listing."
        actions={<PrimaryButton onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Post Job</PrimaryButton>}
      />
      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Post a New Job" maxWidth="lg"
        loading={saving}
        footer={<><SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton loading={saving} onClick={async () => { setSaving(true); await new Promise(r => setTimeout(r, 800)); setSaving(false); setModalOpen(false); refresh(); }}>Post Job</PrimaryButton></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><FieldGroup label="Job Title" required><ModalInput placeholder="e.g. Senior React Developer" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></FieldGroup></div>
          <FieldGroup label="Location"><ModalInput placeholder="Mumbai / Remote" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></FieldGroup>
          <FieldGroup label="Employment Type">
            <ModalSelect value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {['Full-time','Part-time','Contract','Internship','Freelance'].map(t => <option key={t} value={t}>{t}</option>)}
            </ModalSelect>
          </FieldGroup>
          <FieldGroup label="Min Salary (₹)"><ModalInput type="number" placeholder="500000" value={form.salaryMin} onChange={e => setForm({...form, salaryMin: e.target.value})} /></FieldGroup>
          <FieldGroup label="Max Salary (₹)"><ModalInput type="number" placeholder="1200000" value={form.salaryMax} onChange={e => setForm({...form, salaryMax: e.target.value})} /></FieldGroup>
          <div className="sm:col-span-2"><FieldGroup label="Job Description"><ModalTextarea rows={4} placeholder="Describe the role, requirements..." /></FieldGroup></div>
        </div>
      </FormModal>
    </div>
  );
}
