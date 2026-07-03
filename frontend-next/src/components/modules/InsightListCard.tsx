import { Lightbulb } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

type InsightListCardProps = {
 title: string;
 items: string[];
};

export function InsightListCard({ title, items }: InsightListCardProps) {
 return (
 <GlassCard>
 <div className="mb-3 flex items-center gap-2">
 <Lightbulb size={18} className="text-amber-500" />
 <p className="text-sm font-semibold text-slate-800 ">{title}</p>
 </div>
 <ul className="space-y-2">
 {items.map((item) => (
 <li key={item} className="text-sm text-slate-600 ">
 • {item}
 </li>
 ))}
 </ul>
 </GlassCard>
 );
}
