import type { Metadata } from 'next';
import { TimesheetsModuleView } from '@/components/modules/TimesheetsModuleView'; export const metadata: Metadata = { title: 'Timesheets & Tracking — AKUL DRAVIN', description: 'Log weekly hours and track project allocations.',
}; export default function TimesheetsPage() { return <TimesheetsModuleView />;
}
