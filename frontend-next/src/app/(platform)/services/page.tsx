import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Services � AKUL DRAVIN',
 description: 'Enterprise service management: internal service catalog, SLA tracking, service requests and fulfillment workflows.',
};

import { ServicesModuleView } from '@/components/modules/ServicesModuleView';

export default function ServicesPage() {
 return <ServicesModuleView />;
}
