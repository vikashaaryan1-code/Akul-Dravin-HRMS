import type { Metadata } from 'next';
import { AttendanceModuleView } from '@/components/modules/AttendanceModuleView';

export const metadata: Metadata = {
  title: 'Attendance Management — AKUL DRAVIN',
  description: 'Real-time attendance tracking, biometric sync, shift scheduling, overtime analysis and geo-fenced check-in management.',
};

export default function AttendancePage() {
  return <AttendanceModuleView />;
}
