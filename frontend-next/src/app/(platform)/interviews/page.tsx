import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Interviews � AKUL DRAVIN',
 description: 'Interview lifecycle management: panel scheduling, feedback collection, scorecards and offer decision tracking.',
};

import { InterviewsModuleView } from '@/components/modules/InterviewsModuleView';
export default function InterviewsPage() { return <InterviewsModuleView />; }
