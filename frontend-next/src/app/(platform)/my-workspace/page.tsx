import type { Metadata } from 'next';
import { EmployeeSelfServiceView } from '@/components/modules/EmployeeSelfServiceView';

export const metadata: Metadata = {
 title: 'My Workspace — Employee Self Service',
 description: 'Your personal HRMS workspace — attendance, leave, payslips, goals, and company announcements.',
};

export default function MyWorkspacePage() {
 return <EmployeeSelfServiceView />;
}
