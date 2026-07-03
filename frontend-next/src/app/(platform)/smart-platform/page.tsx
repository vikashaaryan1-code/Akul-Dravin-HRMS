import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Smart Platform � AKUL DRAVIN',
 description: 'AI-powered platform intelligence: predictive recommendations, system health, usage analytics and optimization insights.',
};

import { SmartPlatformView } from '@/components/modules/SmartPlatformView';

export default function SmartPlatformPage() {
 return <SmartPlatformView />;
}
