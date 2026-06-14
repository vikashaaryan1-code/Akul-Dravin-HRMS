import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Procurement � AKUL DRAVIN',
  description: 'Procurement and vendor management: purchase orders, vendor onboarding, approval flows and spend analytics.',
};

import { ProcurementModuleView } from '@/components/modules/ProcurementModuleView';

export default function ProcurementPage() {
  return <ProcurementModuleView />;
}
