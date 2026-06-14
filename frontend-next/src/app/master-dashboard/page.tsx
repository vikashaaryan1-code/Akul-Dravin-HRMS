import { Metadata } from 'next';
import { AICommandBridge } from '@/components/dashboard/AICommandBridge';

export const metadata: Metadata = {
  title: 'AI Command Bridge | Akul Dravin OS',
};

export default function MasterDashboardPage() {
  return <AICommandBridge />;
}
