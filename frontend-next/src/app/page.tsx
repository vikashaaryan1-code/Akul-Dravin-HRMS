/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from 'next';
import { LandingPageContent } from '@/components/landing/LandingPageContent';

export const metadata: Metadata = {
  title: 'AKUL DRAVIN HRMS PLATFORM | Enterprise Workforce Automation',
  description:
    'Enterprise HRMS platform for attendance, employee monitoring, permission control, location tracking, payroll, performance analytics, and workflow automation.',
  keywords: [
    'AKUL DRAVIN',
    'HRMS',
    'employee monitoring',
    'RBAC',
    'location tracking',
    'workday analytics',
    'enterprise SaaS',
  ],
};

export default function HomePage() {
  return <LandingPageContent />;
}
