import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Recruiter Hub � AKUL DRAVIN',
 description: 'Recruiter command center: candidate pipeline, job requisitions, sourcing analytics and revenue tracking.',
};

import { RecruiterHubModuleView } from '@/components/modules/RecruiterHubModuleView';
export default function RecruiterHubPage() { return <RecruiterHubModuleView />; }
