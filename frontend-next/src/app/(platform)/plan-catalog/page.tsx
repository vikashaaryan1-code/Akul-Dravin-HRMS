import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plan Catalog � AKUL DRAVIN',
  description: 'Subscription plan management: feature packages, seat limits, trial periods and enterprise licensing.',
};

import { PlanCatalogModuleView } from '@/components/modules/PlanCatalogModuleView';
export default function PlanCatalogPage() { return <PlanCatalogModuleView />; }
