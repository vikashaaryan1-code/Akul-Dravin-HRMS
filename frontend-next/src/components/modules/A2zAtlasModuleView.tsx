'use client';

import Link from 'next/link';
import { ArrowUpRight, Layers3, Map, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
 AKUL_DRAVIN_A2Z_ACTIVE_MODULES,
 AKUL_DRAVIN_A2Z_ASSURANCES,
 AKUL_DRAVIN_A2Z_HERO,
 AKUL_DRAVIN_A2Z_SERVICE_SUITES,
 AKUL_DRAVIN_A2Z_WORKFLOW_STEPS,
} from '@/lib/public-site';
import { useUIStore } from '@/store/ui-store';
import { toRoleLabel, toSafePlatformRole } from '@/utils/platform-config';
import { ModuleLinksBar } from './ModuleLinksBar';

const suiteShells = [
 'border-aqua/20 bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.14),_transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.6),rgba(15,23,42,0.4))]',
 'border-amber/25 bg-[radial-gradient(circle_at_top_left,_rgba(232,90,42,0.14),_transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.6),rgba(15,23,42,0.4))]',
 'border-sky-400/25 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.6),rgba(15,23,42,0.4))]',
 'border-emerald-400/25 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.14),_transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.6),rgba(15,23,42,0.4))]',
 'border-fuchsia-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(217,70,239,0.12),_transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.6),rgba(15,23,42,0.4))]',
];

const stepToneMap: Record<(typeof AKUL_DRAVIN_A2Z_WORKFLOW_STEPS)[number]['status'], string> = {
 ready: 'bg-emerald-400/10 text-emerald-400 ',
 active: 'bg-blue/15 text-aqua ',
 queued: 'bg-amber/15 text-amber ',
};

export function A2zAtlasModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);
 const safeRole = toSafePlatformRole(activeRole);

 return (
 <div className="space-y-5">
 <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-depth-1 to-navy-dark p-5 shadow-glass backdrop-blur sm:p-6">
 <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
 <div className="space-y-5">
 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex rounded-full bg-aqua/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-aqua">
 {AKUL_DRAVIN_A2Z_HERO.badge}
 </span>
 <span className="inline-flex rounded-full border border-white/10 bg-white/5/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 ">
 Active Role: {toRoleLabel(safeRole)}
 </span>
 <span className="inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-400 ">
 Synced into platform workspace
 </span>
 </div>

 <div>
 <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
 AKUL DRAVIN A2Z Atlas is now visible inside the AKUL DRAVIN HRMS command layer.
 </h1>
 <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 ">{AKUL_DRAVIN_A2Z_HERO.subtitle}</p>
 <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 ">{AKUL_DRAVIN_A2Z_HERO.description}</p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <Link
 href={`/dashboard?role=${safeRole}`}
 className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue to-aqua px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-aqua/20 transition hover:opacity-90"
 >
 Return to dashboard <ArrowUpRight size={14} />
 </Link>
 <Link
 href="/a2z"
 className="rounded-full border border-white/10 bg-white/5/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-slate-400 "
 >
 Open public A2Z workflow
 </Link>
 </div>

 <div className="grid gap-3 sm:grid-cols-3">
 {[
 { label: 'Atlas modules', value: AKUL_DRAVIN_A2Z_ACTIVE_MODULES, note: 'AKUL DRAVIN module lanes mapped' },
 { label: 'Service suites', value: AKUL_DRAVIN_A2Z_SERVICE_SUITES.length, note: 'Premium grouped rollout tracks' },
 { label: 'Workflow steps', value: AKUL_DRAVIN_A2Z_WORKFLOW_STEPS.length, note: 'Discovery to handoff sequence' },
 ].map((item) => (
 <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5/5 p-4 shadow-sm backdrop-blur ">
 <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 ">{item.label}</p>
 <p className="mt-3 text-2xl font-semibold text-white ">{item.value}</p>
 <p className="mt-3 text-xs text-slate-400 ">{item.note}</p>
 </div>
 ))}
 </div>
 </div>

 <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.26),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(232,90,42,0.22),_transparent_34%),linear-gradient(145deg,#111B2A,#0f172a)] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.32)]">
 <div className="flex items-start justify-between gap-3">
 <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ember to-amber text-white">
 <Layers3 size={24} />
 </div>
 <span className="rounded-full bg-white/5/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
 Atlas blueprint
 </span>
 </div>
 <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Atlas coverage</p>
 <h2 className="mt-2 text-2xl font-semibold text-white">Command-ready module map</h2>
 <p className="mt-3 text-sm leading-6 text-slate-300">
 Platform, people, finance, growth, and learning suites now follow the same AKUL DRAVIN grouping inside the HRMS workspace.
 </p>
 <div className="mt-5 grid gap-3 sm:grid-cols-2">
 {AKUL_DRAVIN_A2Z_SERVICE_SUITES.slice(0, 4).map((suite) => (
 <div key={suite.id} className="rounded-2xl border border-white/10 bg-white/5/5 p-4">
 <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">{suite.title}</p>
 <p className="mt-2 text-sm text-slate-400">{suite.modules.length} mapped modules</p>
 </div>
 ))}
 </div>
 <div className="mt-5 rounded-2xl border border-white/10 bg-white/5/5 p-4">
 <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Primary promise</p>
 <p className="mt-2 text-sm leading-6 text-white">{AKUL_DRAVIN_A2Z_HERO.title}</p>
 </div>
 </div>
 </div>
 </section>

 <ModuleLinksBar
 links={[
 { label: 'Dashboard', href: `/dashboard?role=${safeRole}` },
 { label: 'Employees', href: `/employees?role=${safeRole}` },
 { label: 'Finance', href: `/finance?role=${safeRole}` },
 { label: 'CRM', href: `/crm?role=${safeRole}` },
 ]}
 isLive
 />

 <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
 <div className="space-y-4">
 <GlassCard>
 <div className="flex items-center gap-3">
 <div className="rounded-2xl bg-aqua/10 p-3 text-aqua">
 <Sparkles size={18} />
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 ">Service suites</p>
 <h2 className="mt-1 text-xl font-semibold text-white ">AKUL DRAVIN module bundles now mapped into AKUL DRAVIN</h2>
 </div>
 </div>
 <div className="mt-5 grid gap-3 xl:grid-cols-2">
 {AKUL_DRAVIN_A2Z_SERVICE_SUITES.map((suite, index) => (
 <article
 key={suite.id}
 className={`rounded-[26px] border p-4 shadow-panel ${suiteShells[index % suiteShells.length]}`}
 >
 <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 ">Suite {index + 1}</p>
 <h3 className="mt-2 text-lg font-semibold text-white ">{suite.title}</h3>
 <p className="mt-2 text-sm leading-6 text-slate-300 ">{suite.description}</p>
 <p className="mt-3 rounded-2xl border border-white/10 bg-white/5/5 p-3 text-sm leading-6 text-slate-300 ">
 {suite.valueProposition}
 </p>
 <div className="mt-4 flex flex-wrap gap-2">
 {suite.modules.map((moduleItem) => (
 <span
 key={moduleItem}
 className="rounded-full border border-white/10 bg-white/5/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 "
 >
 {moduleItem}
 </span>
 ))}
 </div>
 </article>
 ))}
 </div>
 </GlassCard>

 <GlassCard>
 <div className="flex items-center gap-3">
 <div className="rounded-2xl bg-amber/10 p-3 text-amber">
 <Workflow size={18} />
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 ">Workflow mesh</p>
 <h2 className="mt-1 text-xl font-semibold text-white ">Discovery, blueprint, and rollout are now clearly staged</h2>
 </div>
 </div>
 <div className="mt-5 grid gap-3 lg:grid-cols-3">
 {AKUL_DRAVIN_A2Z_WORKFLOW_STEPS.map((step) => (
 <article key={step.id} className="rounded-[24px] border border-white/10 bg-white/5/5 p-4 ">
 <div className="flex items-start justify-between gap-3">
 <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 ">{step.owner}</p>
 <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${stepToneMap[step.status]}`}>
 {step.status}
 </span>
 </div>
 <h3 className="mt-3 text-lg font-semibold text-white ">{step.title}</h3>
 <p className="mt-2 text-xs text-slate-400 ">{step.sla}</p>
 <p className="mt-3 text-sm leading-6 text-slate-300 ">{step.description}</p>
 <div className="mt-4 space-y-2">
 {step.outputs.map((output) => (
 <div key={output} className="flex gap-2 text-sm text-slate-300 ">
 <span className="mt-2 h-1.5 w-1.5 rounded-full bg-aqua" />
 <span>{output}</span>
 </div>
 ))}
 </div>
 </article>
 ))}
 </div>
 </GlassCard>
 </div>

 <div className="space-y-4">
 <GlassCard>
 <div className="flex items-center gap-3">
 <div className="rounded-2xl bg-white/5/5 p-3 text-white ">
 <ShieldCheck size={18} />
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 ">Assurances</p>
 <h2 className="mt-1 text-xl font-semibold text-white ">What changed in the HRMS workspace</h2>
 </div>
 </div>
 <div className="mt-5 space-y-3">
 {AKUL_DRAVIN_A2Z_ASSURANCES.map((item) => (
 <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5/5 p-4 ">
 <p className="text-sm font-semibold text-white ">{item.title}</p>
 <p className="mt-2 text-sm leading-6 text-slate-300 ">{item.description}</p>
 </article>
 ))}
 </div>
 </GlassCard>

 <GlassCard>
 <div className="flex items-center gap-3">
 <div className="rounded-2xl bg-aqua/10 p-3 text-aqua">
 <Map size={18} />
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 ">Next moves</p>
 <h2 className="mt-1 text-xl font-semibold text-white ">Where to use the atlas next</h2>
 </div>
 </div>
 <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300 ">
 <p>Use the atlas to align the employee command layer with recruitment, finance, CRM, and learning routes.</p>
 <p>Open the public A2Z workflow when you need the marketing-side intake form and live workflow request journey.</p>
 <p>Keep the HRMS workspace route for internal module mapping, discovery, and rollout navigation.</p>
 </div>
 <div className="mt-5 flex flex-wrap gap-2">
 <Link href={`/employees?role=${safeRole}`} className="rounded-full border border-white/10 bg-white/5/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-slate-400 ">
 Open employees
 </Link>
 <Link href={`/dashboard?role=${safeRole}`} className="rounded-full border border-white/10 bg-white/5/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-slate-400 ">
 Open dashboard
 </Link>
 </div>
 </GlassCard>
 </div>
 </section>
 </div>
 );
}
