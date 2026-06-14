import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gamification � AKUL DRAVIN',
  description: 'Employee engagement through gamification: points, badges, leaderboards and performance rewards.',
};

import { GamificationModuleView } from '@/components/modules/GamificationModuleView';

export default function GamificationPage() {
  return <GamificationModuleView />;
}
