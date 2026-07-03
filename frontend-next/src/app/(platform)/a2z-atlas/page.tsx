import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'A2Z Atlas � AKUL DRAVIN',
 description: 'Unified organizational atlas: all 47+ modules, workflows, integrations and AI automation blueprints in one navigable map.',
};

import { A2zAtlasModuleView } from '@/components/modules/A2zAtlasModuleView';

export default function A2zAtlasPage() {
 return <A2zAtlasModuleView />;
}
