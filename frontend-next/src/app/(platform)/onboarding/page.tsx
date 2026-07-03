import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Onboarding � AKUL DRAVIN',
 description: 'New hire onboarding: document collection, training scheduling, buddy assignment and 30-60-90 day milestone tracking.',
};

import { OnboardingModuleView } from '@/components/modules/OnboardingModuleView';
export default function OnboardingPage() { return <OnboardingModuleView />; }
