import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin � AKUL DRAVIN',
  description: 'Platform super administration: tenant management, system health, global configurations and security governance.',
};

import { SuperAdminModuleView } from '@/components/modules/SuperAdminModuleView';
export default function SuperAdminPage() { return <SuperAdminModuleView />; }
