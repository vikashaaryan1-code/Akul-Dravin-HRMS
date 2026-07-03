import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Document Management � AKUL DRAVIN',
 description: 'Enterprise document vault: offer letters, experience certificates, salary slips, ID cards and digital signature workflows.',
};

import { DocumentsModuleView } from '@/components/modules/DocumentsModuleView';

export default function DocumentsPage() {
 return <DocumentsModuleView />;
}
