import type { Metadata } from 'next';

/**
 * 🎨 EMPLOYEE IMPORT / EXPORT PAGE
 * Route: /employees/import-export
 *
 * Provides bulk CSV import with drag-and-drop upload,
 * column validation preview, and filtered CSV export.
 */
export const metadata: Metadata = {
 title: 'Import & Export Employees',
 description: 'Bulk import employees from CSV or export filtered employee data as CSV. Includes validation preview and async background processing.',
};

import { EmployeeImportExportView } from '@/components/modules/EmployeeImportExportView';
export default function EmployeeImportExportPage() {
 return <EmployeeImportExportView />;
}
