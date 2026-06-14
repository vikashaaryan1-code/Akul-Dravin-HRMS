import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HR Helpdesk � AKUL DRAVIN',
  description: 'Internal employee support ticketing: HR queries, IT requests, policy questions and resolution tracking.',
};

import { HelpdeskModuleView } from '@/components/modules/HelpdeskModuleView';

export default function HelpdeskPage() {
  return <HelpdeskModuleView />;
}
