import type { Metadata } from 'next';
import { ExecutiveCommandCenter } from '@/components/dashboards/ExecutiveCommandCenter';

export const metadata: Metadata = {
 title: 'Executive Command Center — AKUL DRAVIN',
 description: 'Board-level workforce intelligence: headcount, payroll, compliance, and AI insights.',
};

export default function DashboardPage() {
 return <ExecutiveCommandCenter />;
}
