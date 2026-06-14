import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription Lifecycle � AKUL DRAVIN',
  description: 'Subscription plan management: renewals, upgrades, usage tracking, contract status and billing cycle control.',
};

import { BillingModuleView } from '@/components/modules/BillingModuleView';

export default function SubscriptionsPage() {
  return <BillingModuleView focus="subscriptions" />;
}

