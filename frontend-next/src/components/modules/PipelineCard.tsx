import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';

type PipelineItem = {
  stage: string;
  count: number;
};

type PipelineCardProps = {
  title: string;
  items: PipelineItem[];
};

export function PipelineCard({ title, items }: PipelineCardProps) {
  return (
    <GlassCard>
      <p className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.stage} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700/70 dark:bg-slate-800/70">
            <span className="text-sm text-slate-700 dark:text-slate-200">{item.stage}</span>
            <StatusPill label={String(item.count)} tone="default" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
