import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Permissions & RBAC � AKUL DRAVIN',
 description: 'Role-based access control: permission matrix, module-level grants, department isolation and audit trails.',
};

import { PermissionsModuleView } from '@/components/modules/PermissionsModuleView';

export default function PermissionsPage() {
 return <PermissionsModuleView />;
}
