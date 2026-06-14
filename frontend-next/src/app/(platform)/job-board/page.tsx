import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Board � AKUL DRAVIN',
  description: 'Internal and external job postings: open roles, application tracking, publishing controls and recruitment analytics.',
};

import { JobBoardModuleView } from '@/components/modules/JobBoardModuleView';
export default function JobBoardPage() { return <JobBoardModuleView />; }
