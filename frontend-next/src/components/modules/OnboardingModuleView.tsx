'use client';

import { useState } from 'react';
import { UserPlus, CheckSquare, ClipboardList, Users, BookOpen, Shield, Plus, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { FormModal, FieldGroup, ModalInput, ModalSelect, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { useEmployees } from '@/hooks/useDomainData';

const ONBOARDING_STEPS = [
  { id: 'docs', label: 'Document Verification', icon: <ClipboardList className="h-4 w-4" />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  { id: 'accounts', label: 'Account Setup', icon: <Shield className="h-4 w-4" />, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
  { id: 'training', label: 'Onboarding Training', icon: <BookOpen className="h-4 w-4" />, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  { id: 'team', label: 'Team Introduction', icon: <Users className="h-4 w-4" />, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
  { id: 'complete', label: 'Onboarding Complete', icon: <CheckSquare className="h-4 w-4" />, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
];

type OnboardingEntry = { employeeId: string; name: string; department: string; joinDate: string; step: number; stepLabel: string; progress: number };

export function OnboardingModuleView() {
  const { employees, loading } = useEmployees();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Simulate onboarding: newest 5 employees are "in onboarding"
  const sortedNew = [...employees].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 8);

  const onboardingList: OnboardingEntry[] = sortedNew.map((e, i) => {
    const step = Math.min(i, 4);
    return {
      employeeId: e.id,
      name: e.name,
      department: e.department ?? '—',
      joinDate: e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN') : '—',
      step,
      stepLabel: ONBOARDING_STEPS[step].label,
      progress: Math.round((step / 4) * 100),
    };
  });

  const completed = onboardingList.filter((o) => o.progress === 100).length;
  const inProgress = onboardingList.filter((o) => o.progress > 0 && o.progress < 100).length;

  return (
    <div className="space-y-5 animate-rise">
      <PageTitle title="Employee Onboarding" description="Track new hire onboarding progress and task completion." />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Onboarding', value: onboardingList.length, icon: <UserPlus className="h-4 w-4 text-blue-500" /> },
          { label: 'In Progress', value: inProgress, icon: <ClipboardList className="h-4 w-4 text-amber-500" /> },
          { label: 'Completed', value: completed, icon: <CheckSquare className="h-4 w-4 text-emerald-500" /> },
          { label: 'Total Employees', value: employees.length, icon: <Users className="h-4 w-4 text-violet-500" /> },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p></div>
              <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">{s.icon}</span>
            </div>
          </GlassCard>
        ))}
      </section>

      {/* Onboarding checklist steps */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Onboarding Pipeline</p>
          <PrimaryButton onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Start Onboarding</PrimaryButton>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({length: 4}).map((_,i) => <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
        ) : onboardingList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No employees in onboarding. Start by adding new hires.</div>
        ) : (
          <div className="space-y-3">
            {onboardingList.map((entry) => (
              <div key={entry.employeeId} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{entry.name}</span>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{entry.progress}%</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-slate-500">{entry.department}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">Joined {entry.joinDate}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500" style={{ width: `${entry.progress}%` }} />
                  </div>
                </div>
                <div className="text-xs text-slate-500 shrink-0 hidden sm:block">
                  Step {entry.step + 1}/5: {entry.stepLabel}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Step guide */}
      <GlassCard>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Onboarding Checklist</p>
        <div className="flex flex-col gap-2">
          {ONBOARDING_STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className={`p-2 rounded-lg ${step.color}`}>{step.icon}</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{step.label}</span>
              <span className="ml-auto text-xs text-slate-400">Step {i + 1}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Start New Onboarding"
        loading={saving}
        footer={<><SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton loading={saving} onClick={async () => { setSaving(true); await new Promise(r => setTimeout(r, 600)); setSaving(false); setModalOpen(false); }}>Start Onboarding</PrimaryButton></>}>
        <div className="space-y-4">
          <FieldGroup label="Select Employee" required>
            <ModalSelect>
              <option value="">Choose employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
            </ModalSelect>
          </FieldGroup>
          <FieldGroup label="Joining Date" required><ModalInput type="date" /></FieldGroup>
          <FieldGroup label="Reporting Manager"><ModalInput placeholder="Manager name..." /></FieldGroup>
        </div>
      </FormModal>
    </div>
  );
}
