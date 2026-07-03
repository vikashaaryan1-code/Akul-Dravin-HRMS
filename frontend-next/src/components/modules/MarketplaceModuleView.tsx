'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency } from '@/utils/formatters';

type MarketplaceJob = {
 id: string;
 title: string;
 location: string;
 employmentType: string;
 status: string;
 description: string;
 salaryMin: number;
 salaryMax: number;
};

const fallbackJobs: MarketplaceJob[] = [
 {
 id: 'JOB-4421',
 title: 'Senior Backend Engineer',
 location: 'Bengaluru / Remote',
 employmentType: 'Full Time',
 status: 'open',
 description: 'Build distributed services for payroll, analytics, and automation workflows.',
 salaryMin: 1800000,
 salaryMax: 3200000,
 },
 {
 id: 'JOB-5580',
 title: 'HR Analytics Manager',
 location: 'Mumbai',
 employmentType: 'Full Time',
 status: 'interviewing',
 description: 'Drive workforce intelligence and predictive analytics for enterprise clients.',
 salaryMin: 1400000,
 salaryMax: 2400000,
 },
 {
 id: 'JOB-7704',
 title: 'Talent Acquisition Specialist',
 location: 'Delhi / Hybrid',
 employmentType: 'Contract',
 status: 'open',
 description: 'Lead sourcing, screening, and interview coordination across key hiring functions.',
 salaryMin: 900000,
 salaryMax: 1300000,
 },
];

const toStatusTone = (status: string): 'default' | 'success' | 'warning' => {
 const normalized = status.toLowerCase();
 if (normalized.includes('open')) return 'success';
 if (normalized.includes('interview')) return 'warning';
 return 'default';
};

export function MarketplaceModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);
 const [query, setQuery] = useState('');

 const { data: jobs, isLive, loading, error } = useApiResource({
 loader: async () => {
 const rows = await platformApi.getMarketplaceJobs();
 return rows.map((row) => ({
 id: row.id,
 title: row.title,
 location: row.location,
 employmentType: row.employmentType,
 status: row.status,
 description: row.description,
 salaryMin: Number(row.salaryMin || '0'),
 salaryMax: Number(row.salaryMax || '0'),
 })) satisfies MarketplaceJob[];
 },
 fallback: fallbackJobs,
 });

 const filteredJobs = useMemo(() => {
 const normalized = query.trim().toLowerCase();
 if (!normalized) {
 return jobs;
 }

 return jobs.filter((job) => [job.title, job.location, job.description, job.employmentType].join(' ').toLowerCase().includes(normalized));
 }, [jobs, query]);

 return (
 <div className="space-y-5">
 <PageTitle
 title="Marketplace"
 description="Public and partner job listings connected to recruitment workflows and AI talent scoring."
 />

 <ModuleLinksBar
 links={[
 { label: 'Recruitment', href: `/recruitment?role=${activeRole}` },
 { label: 'Dashboard', href: `/dashboard?role=${activeRole}` },
 { label: 'Sales', href: `/sales?role=${activeRole}` },
 ]}
 isLive={isLive}
 loading={loading}
 error={error}
 />

 <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 ">
 <Search size={14} className="text-slate-500" />
 <input
 value={query}
 onChange={(event) => setQuery(event.target.value)}
 className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
 placeholder="Search title, location, and skills"
 />
 </div>

 <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
 {filteredJobs.map((job) => (
 <GlassCard key={job.id}>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{job.id}</p>
 <h3 className="mt-2 text-lg font-semibold text-slate-900 ">{job.title}</h3>
 <p className="mt-1 text-sm text-slate-600 ">{job.location}</p>
 <p className="mt-3 text-sm text-slate-600 ">{job.description}</p>
 <div className="mt-3 flex items-center justify-between">
 <StatusPill label={job.employmentType} />
 <StatusPill label={job.status} tone={toStatusTone(job.status)} />
 </div>
 <p className="mt-3 text-sm font-semibold text-slate-800 ">
 {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
 </p>
 </GlassCard>
 ))}
 </section>
 </div>
 );
}
