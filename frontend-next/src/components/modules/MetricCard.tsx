import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { KpiWidget } from '@/types/platform';
import { GlassCard } from '@/components/ui/GlassCard';

type MetricCardProps = {
 metric: KpiWidget;
};

const directionStyle = {
 up: 'text-emerald-600 ',
 down: 'text-rose-600 ',
 neutral: 'text-slate-500 ',
};

export function MetricCard({ metric }: MetricCardProps) {
 const Icon = metric.trendDirection === 'up' ? ArrowUpRight : metric.trendDirection === 'down' ? ArrowDownRight : ArrowRight;

 return (
 <GlassCard className="space-y-3">
 <p className="text-xs uppercase tracking-[0.15em] text-slate-500 ">{metric.label}</p>
 <p className="text-2xl font-semibold text-slate-900 ">{metric.value}</p>
 <div className={`inline-flex items-center gap-1 text-xs font-semibold ${directionStyle[metric.trendDirection]}`}>
 <Icon size={14} />
 <span>{metric.trend}</span>
 </div>
 </GlassCard>
 );
}
