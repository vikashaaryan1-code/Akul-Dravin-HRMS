import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Pipeline � AKUL DRAVIN',
  description: 'AI-scored candidate pool: resume parsing, pipeline stages, interview scheduling and offer letter generation.',
};

import { CandidatesModuleView } from '@/components/modules/CandidatesModuleView';
export default function CandidatesPage() { return <CandidatesModuleView />; }
