import type { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/dashboards/AnalyticsDashboard';

export const metadata: Metadata = {
 title: 'Analytics Intelligence — AKUL DRAVIN',
 description: 'Workforce analytics: headcount trends, cost breakdown, attrition by department, geo distribution and productivity metrics.',
};

export default function AnalyticsPage() {
 return <AnalyticsDashboard />;
}
