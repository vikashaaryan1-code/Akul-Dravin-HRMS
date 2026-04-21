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
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{metric.detail}</p>
          </GlassCard>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Operational Highlights</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {moduleConfig.highlights.map((highlight) => (
              <li key={highlight} className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                {highlight}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{moduleConfig.tableTitle}</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/85 dark:border-slate-700 dark:bg-slate-900/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/90 dark:bg-slate-800/80">
                <tr>
                  {moduleConfig.columns.map((column) => (
                    <th key={column.key} className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {moduleConfig.rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-200/70 dark:border-slate-700/70">
                    {moduleConfig.columns.map((column) => (
                      <td key={`${row.id}-${column.key}`} className="px-3 py-2 text-slate-600 dark:text-slate-300">
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
