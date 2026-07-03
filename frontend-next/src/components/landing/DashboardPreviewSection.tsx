import Image from 'next/image';
import { DASHBOARD_PREVIEWS } from './landing-data';
import { SectionHeading } from './SectionHeading';

const previewImages = [
 '/images/office-portal/dashboard-overview.svg',
 '/images/office-portal/tracking-activity.svg',
 '/images/office-portal/performance-wave.svg',
 '/images/office-portal/permissions-grid.svg',
];

export function DashboardPreviewSection() {
 return (
 <section className="px-4 py-20 lg:px-8">
 <div className="mx-auto max-w-7xl space-y-10">
 <SectionHeading
 eyebrow="Dashboard Preview"
 title="Role-based office management dashboards"
 description="Every role gets a focused command surface for attendance, performance, location, task delivery, and access governance."
 />

 <div className="grid gap-4 lg:grid-cols-2">
 {DASHBOARD_PREVIEWS.map((item, index) => {
 const Icon = item.icon;
 return (
 <article
 key={item.title}
 className="group animate-rise rounded-3xl border border-white/80 bg-white p-6 shadow-panel"
 style={{ animationDelay: `${index * 70}ms` }}
 >
 <div className="flex items-start justify-between gap-3">
 <div>
 <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
 <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
 </div>
 <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-aqua/15 to-white text-aqua">
 <Icon className="h-5 w-5" aria-hidden="true" />
 </span>
 </div>

 <div className="relative mt-5 h-40 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50">
 <Image
 src={previewImages[index % previewImages.length]}
 alt={`${item.title} preview`}
 fill
 className="object-cover"
 sizes="(max-width: 1024px) 100vw, 40vw"
 />
 </div>

 <div className="mt-4 grid gap-3 sm:grid-cols-3">
 <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3">
 <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">KPI</p>
 <p className="mt-2 text-2xl font-bold text-ink">93.7%</p>
 <p className="text-xs text-emerald-700">+10.9% this quarter</p>
 </div>
 <div className="rounded-2xl border border-slate-100 bg-white p-3">
 <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">Alerts</p>
 <p className="mt-2 text-2xl font-bold text-ink">11</p>
 <p className="text-xs text-slate-500">Risk-prioritized</p>
 </div>
 <div className="rounded-2xl border border-slate-100 bg-white p-3">
 <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">SLA</p>
 <p className="mt-2 text-2xl font-bold text-ink">99.2%</p>
 <p className="text-xs text-slate-500">Policy compliant</p>
 </div>
 </div>
 </article>
 );
 })}
 </div>
 </div>
 </section>
 );
}
