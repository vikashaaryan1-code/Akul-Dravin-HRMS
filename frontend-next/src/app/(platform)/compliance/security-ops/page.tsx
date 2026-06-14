import type { Metadata } from 'next';
import { SecurityOperationsCenter } from '@/components/dashboards/SecurityOperationsCenter';

export const metadata: Metadata = {
  title: 'Security Operations Center — AKUL DRAVIN',
  description: 'Zero Trust security operations: threat feed, suspicious session tracking, MFA compliance and device trust management.',
};

export default function SecurityOpsPage() {
  return <SecurityOperationsCenter />;
}
