import type { Metadata } from 'next';
import { PerformanceDashboard } from '@/components/dashboards/PerformanceDashboard';

export const metadata: Metadata = {
 title: 'Performance & OKR Hub — AKUL DRAVIN',
 description: 'Q2 OKR tracking: score trends, key results, top performer leaderboard and calibration cycle health.',
};

export default function PerformancePage() {
 return <PerformanceDashboard />;
}
