import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Tracking � AKUL DRAVIN',
 description: 'Workforce tracking: time-on-task, project progress, field operations, delivery milestones and productivity metrics.',
};

import { TrackingModuleView } from '@/components/modules/TrackingModuleView';

export default function TrackingPage() {
 return <TrackingModuleView />;
}
