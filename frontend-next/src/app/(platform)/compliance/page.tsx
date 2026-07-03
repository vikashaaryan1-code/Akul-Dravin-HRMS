import type { Metadata } from 'next';
import { GovernanceDashboard } from '@/components/dashboards/GovernanceDashboard';

export const metadata: Metadata = {
 title: 'Governance & Security — AKUL DRAVIN',
 description: 'Zero Trust security posture: compliance scores, risk register, audit log and framework certification status.',
};

export default function CompliancePage() {
 return <GovernanceDashboard />;
}
