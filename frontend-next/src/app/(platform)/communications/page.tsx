import type { Metadata } from 'next';
import { CommunicationsModuleView } from '@/components/modules/CommunicationsModuleView'; export const metadata: Metadata = { title: 'Communications — AKUL DRAVIN', description: 'Unified notification hub: real-time alerts, approval updates, payroll notifications, WhatsApp, email, and SMS communication channels.',
}; export default function CommunicationsPage() { return <CommunicationsModuleView />;
}
