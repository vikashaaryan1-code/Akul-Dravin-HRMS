import type { Metadata } from 'next';
import { EmployeeProfileView } from '@/components/modules/EmployeeProfileView'; export const metadata: Metadata = { title: 'Employee Profile — AKUL DRAVIN', description: 'Detailed employee profile: personal info, lifecycle history, payroll, attendance, and performance.',
}; interface Props { params: Promise<{ id: string }>;
} export default async function EmployeeProfilePage({ params }: Props) { const { id } = await params; return <EmployeeProfileView employeeId={id} />;
}
