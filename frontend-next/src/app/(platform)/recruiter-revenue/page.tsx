import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Recruiter Revenue � AKUL DRAVIN',
 description: 'Recruiter performance and revenue: placement commissions, client billing, revenue forecasting and target tracking.',
};

import { RecruiterRevenueModuleView } from '@/components/modules/RecruiterRevenueModuleView';
export default function RecruiterRevenuePage() { return <RecruiterRevenueModuleView />; }
