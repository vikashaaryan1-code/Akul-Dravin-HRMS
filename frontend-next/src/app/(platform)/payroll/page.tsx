import type { Metadata } from 'next';
import { PayrollDashboard } from '@/components/dashboards/PayrollDashboard';

export const metadata: Metadata = {
  title: 'Payroll Control Tower — AKUL DRAVIN',
  description: 'Payroll cycle management: gross/net trends, variance alerts, TDS analysis and audit-locked payslip register.',
};

export default function PayrollPage() {
  return <PayrollDashboard />;
}
