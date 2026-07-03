import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Sales Intelligence � AKUL DRAVIN',
 description: 'Sales command center: lead management, deal pipeline, commission tracking, targets and revenue analytics.',
};

import { SalesModuleView } from '@/components/modules/SalesModuleView';

export default function SalesPage() {
 return <SalesModuleView />;
}
