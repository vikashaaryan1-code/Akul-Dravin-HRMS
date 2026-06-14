import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'White Label � AKUL DRAVIN',
  description: 'White label platform configuration: custom branding, domain mapping, logo, colors and partner portal setup.',
};

import { WhiteLabelModuleView } from '@/components/modules/WhiteLabelModuleView';
export default function WhiteLabelPage() { return <WhiteLabelModuleView />; }
