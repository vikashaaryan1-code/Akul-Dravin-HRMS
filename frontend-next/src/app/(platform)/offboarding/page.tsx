import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Offboarding � AKUL DRAVIN',
 description: 'Employee exit management: clearance checklist, knowledge transfer, final settlement and alumni portal.',
};

import { OffboardingModuleView } from '@/components/modules/OffboardingModuleView';
export default function OffboardingPage() { return <OffboardingModuleView />; }
