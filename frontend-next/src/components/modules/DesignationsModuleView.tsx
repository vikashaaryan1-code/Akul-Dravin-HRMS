'use client';

import { useState } from 'react';
import { Award, Users, TrendingUp, BarChart3, Plus } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { useEmployees } from '@/hooks/useDomainData';

type DesigRow = { designation: string; count: number; departments: string; level: string };

export function DesignationsModuleView() {
  const { employees, loading } = useEmployees();
  const [modalOpen, setModalOpen] = useState(false);
  const [newDesig, setNewDesig] = useState('');
  const [saving, setSaving] = useState(false);

  const desigMap = new Map<string, { count: number; depts: Set<string> }>();
  for (const emp of employees) {
    const d = emp.designation || 'Unassigned';
    if (!desigMap.has(d)) desigMap.set(d, { count: 0, depts: new Set() });
    const entry = desigMap.get(d)!;
    entry.count++;
    if (emp.department) entry.depts.add(emp.department);
  }

  const rows: DesigRow[] = Array.from(desigMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([designation, info]) => ({
      designation,
      count: info.count,
      departments: Array.from(info.depts).slice(0, 2).join(', ') || '—',
      level: designation.toLowerCase().includes('senior') || designation.toLowerCase().includes('lead') ? 'Senior' :
             designation.toLowerCase().includes('junior') ? 'Junior' : 'Mid',
    }));

  const columns: ColumnDef<DesigRow>[] = [
    { key: 'designation', label: 'Designation', sortable: true },
    { key: 'count', label: 'Employees', sortable: true, render: (v) => <span className="font-semibold text-blue-600">{v as number}</span> },
    { key: 'departments', label: 'Departments', sortable: false },
    { key: 'level', label: 'Level', sortable: true, render: (v) => {
      const colors: Record<string, string> = { Senior: 'text-violet-600 bg-violet-50', Junior: 'text-emerald-600 bg-emerald-50', Mid: 'text-blue-600 bg-blue-50' };
      return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[v as string] ?? ''}`}>{v as string}</span>;
    }},
  ];

  return (
    <div className="space-y-5 animate-rise">
      <PageTitle title="Designations" description="Manage roles, levels and organizational hierarchy." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Designations', value: rows.length, icon: <Award className="h-4 w-4" /> },
          { label: 'Total Employees', value: employees.length, icon: <Users className="h-4 w-4" /> },
          { label: 'Senior Roles', value: rows.filter(r => r.level === 'Senior').length, icon: <TrendingUp className="h-4 w-4" /> },
          { label: 'Avg per Role', value: rows.length > 0 ? Math.round(employees.length / rows.length) : 0, icon: <BarChart3 className="h-4 w-4" /> },
        ].map((s) => (
          <GlassCard key={s.label}>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
          </GlassCard>
        ))}
      </section>
      <DataTable
        title="All Designations"
        columns={columns}
        data={rows}
        loading={loading}
        searchPlaceholder="Search designation..."
        searchKeys={['designation'] as never[]}
        exportFileName="designations"
        emptyMessage="No designations found. Add employees to see designations."
        actions={<PrimaryButton onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Add Designation</PrimaryButton>}
      />
      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Designation"
        footer={<><SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton loading={saving} onClick={async () => { setSaving(true); await new Promise(r => setTimeout(r, 500)); setSaving(false); setModalOpen(false); }}>Save</PrimaryButton></>}>
        <FieldGroup label="Designation Title" required><ModalInput placeholder="e.g. Senior Engineer" value={newDesig} onChange={e => setNewDesig(e.target.value)} /></FieldGroup>
      </FormModal>
    </div>
  );
}
