import type { Metadata } from 'next';
import { LeaveModuleView } from '@/components/modules/LeaveModuleView';

export const metadata: Metadata = {
 title: 'Leave Management — AKUL DRAVIN',
 description: 'Employee leave lifecycle: requests, approvals, leave balance, carry-forward policy and holiday calendar management.',
};

export default function LeavePage() {
 return <LeaveModuleView />;
}
