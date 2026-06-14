import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace � AKUL DRAVIN',
  description: 'Platform marketplace: third-party integrations, plugins, add-ons and partner solutions for the AKUL DRAVIN ecosystem.',
};

import { MarketplaceModuleView } from '@/components/modules/MarketplaceModuleView';

export default function MarketplacePage() {
  return <MarketplaceModuleView />;
}
