import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Workflow Automation — AKUL DRAVIN',
 description: 'No-code workflow builder: automate attendance, payroll, approvals, notifications and cross-module triggers with BullMQ.',
};

import { AutomationPageContent } from './AutomationPageContent';

export default function AutomationPage() {
 return <AutomationPageContent />;
}
