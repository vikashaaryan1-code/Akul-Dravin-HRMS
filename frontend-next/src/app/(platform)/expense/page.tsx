import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Expense Management � AKUL DRAVIN',
 description: 'Employee expense reporting: claim submission, receipt uploads, manager approvals and reimbursement tracking.',
};

import { ExpenseModuleView } from '@/components/modules/ExpenseModuleView';
export default function ExpensePage() { return <ExpenseModuleView />; }
