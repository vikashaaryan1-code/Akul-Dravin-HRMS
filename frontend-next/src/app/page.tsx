import type { Metadata } from 'next';
import { PremiumLandingPage } from '@/components/landing/PremiumLandingPage';
import { getPublicLandingData } from '@/lib/public-site';

export const metadata: Metadata = {
  title: 'AKUL DRAVIN | Premium HRMS, CRM, Finance & Operations Platform',
  description:
    'Premium international landing page for AKUL DRAVIN: A2Z HRMS, CRM, finance, automation, marketplace, and business operations in one full-stack platform.',
  keywords: [
    'AKUL DRAVIN',
    'HRMS',
    'CRM',
    'Finance Platform',
    'Business OS',
    'Enterprise SaaS',
    'AI Automation',
    'International Frontend',
  ],
};

export const revalidate = 120;

export default async function HomePage() {
  const data = await getPublicLandingData();
  return <PremiumLandingPage data={data} />;
}
