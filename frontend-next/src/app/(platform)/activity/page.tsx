import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Activity Feed � AKUL DRAVIN',
 description: 'Live organizational activity stream: employee events, approvals, system alerts, AI triggers and audit log entries.',
};

import { ActivityFeedModuleView } from '@/components/modules/ActivityFeedModuleView';
export default function ActivityFeedPage() { return <ActivityFeedModuleView />; }
