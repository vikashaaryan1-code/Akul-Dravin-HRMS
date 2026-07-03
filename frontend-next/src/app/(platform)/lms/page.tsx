import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Learning Management System � AKUL DRAVIN',
 description: 'Enterprise LMS: course catalog, employee learning paths, progress tracking and certification management.',
};

import { LmsModuleView } from '@/components/modules/LmsModuleView';

export default function LmsPage() {
 return <LmsModuleView />;
}
