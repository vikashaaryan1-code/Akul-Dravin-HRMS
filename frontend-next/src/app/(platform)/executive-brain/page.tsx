import type { Metadata } from 'next';
import { ExecutiveCommandCenter } from '@/components/dashboards/ExecutiveCommandCenter';

export const metadata: Metadata = {
 title: 'Executive Brain — AKUL DRAVIN',
 description: 'AI executive intelligence layer: predictive analytics, workforce insights, board-level KPIs and strategic decision support.',
};

export default function ExecutiveBrainPage() {
 return <ExecutiveCommandCenter />;
}
