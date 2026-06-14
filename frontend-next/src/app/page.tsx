import type { Metadata } from 'next';
import { PremiumLandingPage } from '@/components/landing/PremiumLandingPage';
import { getPublicLandingData } from '@/lib/public-site';

export const metadata: Metadata = {
  title: 'AKUL DRAVIN | Sovereign Institutional Coordination Substrate',
  description:
    'The Akul Dravin Sovereign Coordination Kernel: A deterministic, forensically-immutable institutional operating system for high-trust business execution and human-governed automation.',
  keywords: [
    'AKUL DRAVIN',
    'Institutional OS',
    'Sovereign Coordination',
    'Forensic Governance',
    'Deterministic Execution',
    'Human-Governed AI',
    'Enterprise SaaS',
  ],
};

export const revalidate = 120;

export default async function HomePage() {
  const data = await getPublicLandingData();
  return <PremiumLandingPage data={data} />;
}
