import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Task Management � AKUL DRAVIN',
 description: 'Organizational task management: assignments, deadlines, progress tracking, team workload and priority queues.',
};

import { TasksModuleView } from '@/components/modules/TasksModuleView';

export default function TasksPage() {
 return <TasksModuleView />;
}
