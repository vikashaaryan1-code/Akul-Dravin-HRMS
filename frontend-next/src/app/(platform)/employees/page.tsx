import type { Metadata } from 'next';
import { EmployeesModuleView } from '@/components/modules/EmployeesModuleView';

export const metadata: Metadata = {
 title: 'HRMS Intelligence — AKUL DRAVIN',
 description: 'Workforce command centre: attendance, leave, lifecycle funnel and department headcount.',
};

export default function EmployeesPage() {
 return <EmployeesModuleView />;
}

