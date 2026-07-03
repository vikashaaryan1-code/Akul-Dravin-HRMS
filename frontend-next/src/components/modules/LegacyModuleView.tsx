'use client';

import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { legacyModuleConfigs, type LegacyModuleKey } from '@/services/legacy-module-data';

type LegacyModuleViewProps = {
 moduleKey: LegacyModuleKey;
};

export function LegacyModuleView({ moduleKey }: LegacyModuleViewProps) {
 const moduleConfig = legacyModuleConfigs[moduleKey];

 return (
 <div className="space-y-5">
 <PageTitle title={moduleConfig.title} description={moduleConfig.description} />

 <ModuleLinksBar links={moduleConfig.quickLinks} isLive={false} />

 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {moduleConfig.metrics.map((metric) => (
 <GlassCard key={metric.label}>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
 <p className="mt-2 text-2xl font-semibold text-slate-900 ">{metric.value}</p>
 <p className="mt-1 text-xs text-slate-500 ">{metric.detail}</p>
 </GlassCard>
 ))}
 </section>

 <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
 <GlassCard>
 <p className="text-sm font-semibold text-slate-800 ">Operational Highlights</p>
 <ul className="mt-3 space-y-2 text-sm text-slate-600 ">
 {moduleConfig.highlights.map((highlight) => (
 <li key={highlight} className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 ">
 {highlight}
 </li>
 ))}
 </ul>
 </GlassCard>

 <GlassCard>
 <p className="text-sm font-semibold text-slate-800 ">{moduleConfig.tableTitle}</p>
 <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/85 ">
 <table className="min-w-full text-left text-sm">
 <thead className="bg-slate-50/90 ">
 <tr>
 {moduleConfig.columns.map((column) => (
 <th key={column.key} className="px-3 py-2 font-semibold text-slate-700 ">
 {column.label}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {moduleConfig.rows.map((row) => (
 <tr key={row.id} className="border-t border-slate-200/70 ">
 {moduleConfig.columns.map((column) => (
 <td key={`${row.id}-${column.key}`} className="px-3 py-2 text-slate-600 ">
 {row[column.key]}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </GlassCard>
 </section>
 </div>
 );
}
