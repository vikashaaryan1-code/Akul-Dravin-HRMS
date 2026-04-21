import type { Metadata } from 'next';
import { A2zPageExperience } from '@/components/landing/A2zPageExperience';
import { getPublicA2zData } from '@/lib/public-site';

export const metadata: Metadata = {
  title: 'AKUL DRAVIN | A2Z Workflow Page',
  description:
    'Dedicated A2Z page with A2Z workflow form for complete HRMS, CRM, finance, and operations rollout planning.',
};

export const revalidate = 120;

export default async function A2zPage() {
  const data = await getPublicA2zData();
  return <A2zPageExperience data={data} />;
}
