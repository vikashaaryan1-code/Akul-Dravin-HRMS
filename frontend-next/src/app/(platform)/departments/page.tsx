import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Departments � AKUL DRAVIN',
  description: 'Organizational department management: structure, headcount, cost centers and reporting hierarchy.',
};

import { DepartmentsModuleView } from '@/components/modules/DepartmentsModuleView';
export default function DepartmentsPage() { return <DepartmentsModuleView />; }
