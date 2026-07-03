import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Settings � AKUL DRAVIN',
 description: 'Account and platform settings: profile, notifications, security preferences, integrations and tenant configuration.',
};

import { SettingsModuleView } from '@/components/modules/SettingsModuleView';

export default function SettingsPage() {
 return <SettingsModuleView />;
}
