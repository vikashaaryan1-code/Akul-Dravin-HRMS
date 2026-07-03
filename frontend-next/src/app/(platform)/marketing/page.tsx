import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Marketing � AKUL DRAVIN',
 description: 'Marketing operations hub: campaign management, lead generation, content calendar and marketing analytics.',
};

import { MarketingModuleView } from '@/components/modules/MarketingModuleView';

export default function MarketingPage() {
 return <MarketingModuleView />;
}
