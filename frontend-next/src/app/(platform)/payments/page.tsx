import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payments & Collections � AKUL DRAVIN',
  description: 'Invoice management, payment collection, receivables tracking and billing reconciliation for the platform.',
};

import { BillingModuleView } from '@/components/modules/BillingModuleView';

export default function PaymentsPage() {
  return <BillingModuleView focus="payments" />;
}

