import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Designations � AKUL DRAVIN',
 description: 'Job designation and grade management: role hierarchy, pay bands, and designation-level access control.',
};

import { DesignationsModuleView } from '@/components/modules/DesignationsModuleView';
export default function DesignationsPage() { return <DesignationsModuleView />; }
