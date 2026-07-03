import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'CRM � AKUL DRAVIN',
 description: 'Customer relationship management: lead pipeline, deal tracking, contact management and revenue forecasting.',
};

import { CrmModuleView } from '@/components/modules/CrmModuleView';

export default function CrmPage() {
 return <CrmModuleView />;
}
