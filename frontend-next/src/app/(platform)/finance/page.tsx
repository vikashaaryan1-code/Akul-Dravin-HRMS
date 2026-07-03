import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Finance Management � AKUL DRAVIN',
 description: 'Corporate finance overview: P&L, revenue vs expenses, GST compliance, cash flow and budget variance analysis.',
};

import { FinanceModuleView } from '@/components/modules/FinanceModuleView';

export default function FinancePage() {
 return <FinanceModuleView />;
}
