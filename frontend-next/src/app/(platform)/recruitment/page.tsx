import type { Metadata } from 'next';
import { AtsDashboard } from '@/components/dashboards/AtsDashboard';

export const metadata: Metadata = {
 title: 'ATS & Recruitment — AKUL DRAVIN',
 description: 'AI-powered recruitment marketplace: pipeline funnel, candidate scoring, source analytics and role management.',
};

export default function RecruitmentPage() {
 return <AtsDashboard />;
}
