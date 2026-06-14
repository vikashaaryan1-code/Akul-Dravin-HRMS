'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, FileText, Plus, RefreshCw } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, ModalSelect, ModalTextarea, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';

type ComplianceItem = { id: string; title: string; category: string; dueDate: string; status: string; owner: string; priority: string };

const SAMPLE_ITEMS: ComplianceItem[] = [
  { id: '1', title: 'Annual PF Filing', category: 'Statutory', dueDate: '2025-06-30', status: 'Pending', owner: 'HR Team', priority: 'High' },
  { id: '2', title: 'ESI Compliance Report', category: 'Statutory', dueDate: '2025-05-15', status: 'Completed', owner: 'Finance', priority: 'High' },
  { id: '3', title: 'Professional Tax Filing', category: 'Tax', dueDate: '2025-07-01', status: 'In Progress', owner: 'Finance', priority: 'Medium' },
  { id: '4', title: 'POSH Policy Review', category: 'Policy', dueDate: '2025-08-01', status: 'Pending', owner: 'HR Manager', priority: 'High' },
  { id: '5', title: 'TDS Return Q1', category: 'Tax', dueDate: '2025-07-31', status: 'Pending', owner: 'Finance', priority: 'High' },
  { id: '6', title: 'ISO 27001 Audit', category: 'Security', dueDate: '2025-09-01', status: 'Not Started', owner: 'IT Team', priority: 'Medium' },
  { id: '7', title: 'GDPR Data Review', category: 'Data Privacy', dueDate: '2025-06-15', status: 'In Progress', owner: 'CTO', priority: 'High' },
];

export function ComplianceModuleView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Statutory', dueDate: '', owner: '', priority: 'Medium' });

  const total = SAMPLE_ITEMS.length;
  const completed = SAMPLE_ITEMS.filter(i => i.status === 'Completed').length;
  const pending = SAMPLE_ITEMS.filter(i => i.status === 'Pending').length;
  const overdue = SAMPLE_ITEMS.filter(i => new Date(i.dueDate) < new Date() && i.status !== 'Completed').length;
  const score = Math.round((completed / total) * 100);

  const columns: ColumnDef<ComplianceItem>[] = [
    { key: 'title', label: 'Compliance Item', sortable: true },
    { key: 'category', label: 'Category', sortable: true, render: (v) => <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">{v as string}</span> },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'dueDate', label: 'Due Date', sortable: true, render: (v) => {
      const isOverdue = new Date(v as string) < new Date();
      return <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{new Date(v as string).toLocaleDateString('en-IN')}</span>;
    }},
    { key: 'priority', label: 'Priority', sortable: true, render: (v) => {
      const colors: Record<string, string> = { High: 'text-red-600 bg-red-50', Medium: 'text-amber-600 bg-amber-50', Low: 'text-emerald-600 bg-emerald-50' };
      return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[v as string] ?? ''}`}>{v as string}</span>;
    }},
    { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusPill label={v as string} /> },
  ];

  return (
    <div className="space-y-5 animate-rise">
      <PageTitle title="Compliance Centre" description="Track statutory, legal, and regulatory compliance obligations." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Compliance Score', value: `${score}%`, icon: <Shield className="h-4 w-4 text-emerald-500" /> },
          { label: 'Total Items', value: total, icon: <FileText className="h-4 w-4 text-blue-500" /> },
          { label: 'Pending', value: pending, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
          { label: 'Overdue', value: overdue, icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p></div>
              <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">{s.icon}</span>
            </div>
          </GlassCard>
        ))}
      </section>

      {/* Score bar */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Overall Compliance Progress</p>
          <span className="text-sm font-bold text-emerald-600">{completed}/{total} Complete</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700" style={{ width: `${score}%` }} />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          {[{label:'Completed',val:completed,c:'text-emerald-500'},{label:'In Progress',val:SAMPLE_ITEMS.filter(i=>i.status==='In Progress').length,c:'text-blue-500'},{label:'Pending',val:pending,c:'text-amber-500'},{label:'Overdue',val:overdue,c:'text-red-500'}].map(s=>(
            <span key={s.label}><span className={`font-semibold ${s.c}`}>{s.val}</span> {s.label}</span>
          ))}
        </div>
      </GlassCard>

      <DataTable
        title="Compliance Items"
        columns={columns}
        data={SAMPLE_ITEMS}
        searchPlaceholder="Search compliance item..."
        exportFileName="compliance"
        emptyMessage="No compliance items. Add your first obligation."
        actions={<PrimaryButton onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Add Item</PrimaryButton>}
      />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Compliance Item"
        loading={saving}
        footer={<><SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton loading={saving} onClick={async () => { setSaving(true); await new Promise(r => setTimeout(r, 600)); setSaving(false); setModalOpen(false); }}>Add Item</PrimaryButton></>}>
        <div className="space-y-4">
          <FieldGroup label="Item Title" required><ModalInput placeholder="e.g. Annual PF Filing" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Category"><ModalSelect value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{['Statutory','Tax','Policy','Security','Data Privacy','Legal'].map(c=><option key={c} value={c}>{c}</option>)}</ModalSelect></FieldGroup>
            <FieldGroup label="Priority"><ModalSelect value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>{['High','Medium','Low'].map(p=><option key={p} value={p}>{p}</option>)}</ModalSelect></FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Due Date" required><ModalInput type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></FieldGroup>
            <FieldGroup label="Owner"><ModalInput placeholder="Team or person..." value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} /></FieldGroup>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
