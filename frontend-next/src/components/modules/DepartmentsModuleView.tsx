'use client';

import { useState } from 'react';
import { Users, Building2, Plus, Pencil, Trash2, BarChart3, TrendingUp } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useEmployees } from '@/hooks/useDomainData';

type DeptRow = { department: string; headcount: number; avgDesignation: string; status: string };

export function DepartmentsModuleView() {
  const { employees, loading } = useEmployees();
  const [modalOpen, setModalOpen] = useState(false);
  const [newDept, setNewDept] = useState('');
  const [saving, setSaving] = useState(false);

  // Aggregate departments from employee data
  const deptMap = new Map<string, number>();
  for (const emp of employees) {
    const d = emp.department || 'Unassigned';
    deptMap.set(d, (deptMap.get(d) ?? 0) + 1);
  }
  const rows: DeptRow[] = Array.from(deptMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([department, headcount]) => ({
      department,
      headcount,
      avgDesignation: employees.filter((e) => e.department === department)[0]?.designation ?? '—',
      status: headcount > 10 ? 'Large' : headcount > 4 ? 'Medium' : 'Small',
    }));

  const totalHeadcount = employees.length;
  const totalDepts = deptMap.size;
  const largestDept = rows[0]?.department ?? '—';
  const avgSize = totalDepts > 0 ? Math.round(totalHeadcount / totalDepts) : 0;

  const columns: ColumnDef<DeptRow>[] = [
    { key: 'department', label: 'Department', sortable: true },
    { key: 'headcount', label: 'Headcount', sortable: true, render: (v) => <span className="font-semibold text-blue-600">{v as number}</span> },
    { key: 'avgDesignation', label: 'Sample Role', sortable: false },
    {
      key: 'status', label: 'Size', sortable: true,
      render: (v) => <StatusPill label={v as string} />,
    },
  ];

  return (
    <div className="space-y-5 animate-rise">
      <PageTitle title="Departments" description="Manage organizational structure and department headcount." />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Departments', value: totalDepts, icon: <Building2 className="h-4 w-4" />, color: 'text-blue-500' },
          { label: 'Total Headcount', value: totalHeadcount, icon: <Users className="h-4 w-4" />, color: 'text-violet-500' },
          { label: 'Largest Department', value: largestDept, icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-500' },
          { label: 'Avg Team Size', value: avgSize, icon: <BarChart3 className="h-4 w-4" />, color: 'text-amber-500' },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
              </div>
              <span className={`${s.color} p-2 rounded-xl bg-slate-100 dark:bg-slate-800`}>{s.icon}</span>
            </div>
          </GlassCard>
        ))}
      </section>

      <DataTable
        title="All Departments"
        columns={columns}
        data={rows}
        loading={loading}
        searchPlaceholder="Search department..."
        searchKeys={['department'] as never[]}
        exportFileName="departments"
        pageSize={15}
        emptyMessage="No departments found. Add employees to see departments."
        actions={
          <PrimaryButton onClick={() => setModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Department
          </PrimaryButton>
        }
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Department"
        subtitle="Add a new organizational department"
        loading={saving}
        footer={
          <>
            <SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton
              loading={saving}
              onClick={async () => {
                if (!newDept.trim()) return;
                setSaving(true);
                await new Promise((r) => setTimeout(r, 600));
                setSaving(false);
                setModalOpen(false);
                setNewDept('');
              }}
            >
              Create Department
            </PrimaryButton>
          </>
        }
      >
        <FieldGroup label="Department Name" required>
          <ModalInput
            placeholder="e.g. Engineering, Sales, HR..."
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
          />
        </FieldGroup>
      </FormModal>
    </div>
  );
}
