'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/modules/MetricCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi } from '@/services/api/platform-api';
import { projectRecords, taskRecords } from '@/services/platform-data';
import { useUIStore } from '@/store/ui-store';

export function TasksModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [tasks, projects] = await Promise.all([
        platformApi.getTasks(),
        platformApi.getProjects(),
      ]);

      return {
        tasks,
        projects,
      };
    },
    fallback: {
      tasks: taskRecords,
      projects: projectRecords,
    },
  });

  const metrics = useMemo(() => {
    const completed = data.tasks.filter((task) => task.status.toLowerCase().includes('completed')).length;
    const inProgress = data.tasks.filter((task) => task.status.toLowerCase().includes('progress')).length;
    const blocked = data.tasks.filter((task) => task.status.toLowerCase().includes('blocked')).length;

    return [
      {
        id: 'tk1',
        label: 'Total Tasks',
        value: String(data.tasks.length),
        trend: `${completed} completed`,
        trendDirection: 'up' as const,
      },
      {
        id: 'tk2',
        label: 'In Progress',
        value: String(inProgress),
        trend: '+3 active today',
        trendDirection: 'neutral' as const,
      },
      {
        id: 'tk3',
        label: 'Blocked Tasks',
        value: String(blocked),
        trend: blocked > 0 ? 'Needs manager action' : 'No blockers',
        trendDirection: blocked > 0 ? ('down' as const) : ('up' as const),
      },
      {
        id: 'tk4',
        label: 'Project Completion Avg',
        value: `${Math.round(data.projects.reduce((sum, project) => sum + Number(project.completion), 0) / Math.max(data.projects.length, 1))}%`,
        trend: isLive ? 'Live project updates' : 'Fallback roadmap snapshot',
        trendDirection: 'up' as const,
      },
    ];
  }, [data.projects, data.tasks, isLive]);

  const projectBars = useMemo(
    () => data.projects.map((project) => ({ name: project.name, value: Number(project.completion) })),
    [data.projects],
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Task & Work Management"
        description="Manage assignments, priorities, deadlines, and project delivery with role-based accountability."
      />

      <ModuleLinksBar
        links={[
          { label: 'Tracking', href: `/tracking?role=${activeRole}` },
          { label: 'Performance', href: `/performance?role=${activeRole}` },
          { label: 'Attendance', href: `/attendance?role=${activeRole}` },
          { label: 'Dashboard', href: `/dashboard?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StackedBarChart title="Project Completion" data={projectBars} mode="single" />

        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Task Priority Snapshot</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>High Priority: {data.tasks.filter((item) => item.priority.toLowerCase() === 'high').length}</li>
            <li>Medium Priority: {data.tasks.filter((item) => item.priority.toLowerCase() === 'medium').length}</li>
            <li>Low Priority: {data.tasks.filter((item) => item.priority.toLowerCase() === 'low').length}</li>
            <li>Overdue Risk: {data.tasks.filter((item) => !item.status.toLowerCase().includes('completed')).length} active items</li>
          </ul>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <GlassCard className="space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Task Assignment Board</p>
          <SimpleTable
            columns={[
              { key: 'taskName', label: 'Task' },
              { key: 'assignee', label: 'Assignee' },
              { key: 'project', label: 'Project' },
              { key: 'priority', label: 'Priority' },
              { key: 'status', label: 'Status' },
              { key: 'dueDate', label: 'Due Date' },
            ]}
            rows={data.tasks}
          />
        </GlassCard>

        <GlassCard className="space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Project Tracker</p>
          <SimpleTable
            columns={[
              { key: 'name', label: 'Project' },
              { key: 'owner', label: 'Owner' },
              {
                key: 'completion',
                label: 'Completion',
                render: (row) => `${row.completion}%`,
              },
            ]}
            rows={data.projects}
          />
        </GlassCard>
      </section>
    </div>
  );
}
