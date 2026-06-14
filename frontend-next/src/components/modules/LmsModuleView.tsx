'use client';

import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { useUIStore } from '@/store/ui-store';
import { platformApi } from '@/services/api/platform-api';

type Course     = { id: string; title: string; category: string; duration: string; enrolled: number; completion: number; status: string };
type MyLearning = { id: string; course: string; progress: number; dueDate: string; status: string };
type Trend      = { name: string; value: number };
type Summary    = { totalCourses: number; avgCompletion: number; totalEnrolled: number; myCoursesCount: number; completedCount: number };

export function LmsModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const [courses,    setCourses]    = useState<Course[]>([]);
  const [myLearning, setMyLearning] = useState<MyLearning[]>([]);
  const [trend,      setTrend]      = useState<Trend[]>([]);
  const [summary,    setSummary]    = useState<Summary | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      platformApi.getLmsCourses(),
      platformApi.getLmsMyLearning(),
      platformApi.getLmsCompletionTrend(),
      platformApi.getLmsSummary(),
    ])
      .then(([c, ml, t, s]) => {
        setCourses((c as any).data ?? c);
        setMyLearning((ml as any).data ?? ml);
        setTrend((t as any).data ?? t);
        setSummary((s as any).data ?? s);
      })
      .catch((e) => setError(String(e?.message ?? 'Failed to load LMS data')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading LMS data…</div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-400">Error: {error}</div>
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Learning Management System"
        description="Track course completion, assign mandatory training, and build a culture of continuous learning."
      />

      <ModuleLinksBar
        links={[
          { label: 'Performance', href: `/performance?role=${activeRole}` },
          { label: 'Employees',   href: `/employees?role=${activeRole}` },
          { label: 'Gamification', href: `/gamification?role=${activeRole}` },
        ]}
        isLive={true}
        loading={false}
        error={null}
      />

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Active Courses</p>
          <p className="mt-2 text-2xl font-semibold">{summary?.totalCourses ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">1 mandatory</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Avg Completion</p>
          <p className="mt-2 text-2xl font-semibold text-indigo-400">{summary?.avgCompletion ?? 0}%</p>
          <p className="mt-1 text-xs text-slate-500">Across all courses</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Total Enrolled</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {(summary?.totalEnrolled ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Seat-enrollments</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">My Courses</p>
          <p className="mt-2 text-2xl font-semibold">{summary?.myCoursesCount ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">{summary?.completedCount ?? 0} completed</p>
        </GlassCard>
      </section>

      {/* Trend + My Learning */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendAreaChart title="Monthly Completion Rate Trend" color="#6366f1" data={trend} />
        </div>

        <GlassCard>
          <p className="text-sm font-semibold text-white mb-3">My Learning Path</p>
          {myLearning.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No learning records yet.</p>
          ) : (
            <ul className="space-y-3">
              {myLearning.slice(0, 4).map((m) => (
                <li key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate pr-2">{m.course}</span>
                    <StatusPill
                      label={m.status}
                      tone={m.status === 'Completed' ? 'success' : 'warning'}
                    />
                  </div>
                  <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <p className="text-right text-[10px] text-slate-500">{m.progress}%</p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>

      {/* Course catalog */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Course Catalog</h2>
        <SimpleTable
          rows={courses}
          columns={[
            { key: 'id',         label: 'Course ID' },
            { key: 'title',      label: 'Course Title' },
            { key: 'category',   label: 'Category' },
            { key: 'duration',   label: 'Duration' },
            { key: 'enrolled',   label: 'Enrolled' },
            {
              key: 'completion',
              label: 'Completion %',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="relative h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                      style={{ width: `${row.completion}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{row.completion}%</span>
                </div>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (
                <StatusPill
                  label={row.status}
                  tone={row.status === 'Mandatory' ? 'danger' : 'success'}
                />
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
