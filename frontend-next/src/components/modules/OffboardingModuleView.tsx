'use client';

import { useState } from 'react';
import { LogOut, FileText, ShieldOff, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, ModalSelect, ModalTextarea, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useEmployees } from '@/hooks/useDomainData';

const OFFBOARDING_STEPS = ['Exit Interview', 'Asset Return', 'Access Revocation', 'Final Settlement', 'Clearance Certificate'];

type OffboardRow = { id: string; name: string; department: string; lastDay: string; reason: string; step: string; status: string };

export function OffboardingModuleView() {
 const { employees, loading } = useEmployees();
 const [modalOpen, setModalOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState({ employeeId: '', lastDay: '', reason: 'Resignation', notes: '' });

 /* Simulate: last 3 employees in offboarding */ const offboardList: OffboardRow[] = employees.slice(-3).map((e, i) => ({
 id: e.id,
 name: e.name,
 department: e.department ?? '—',
 lastDay: new Date(Date.now() + (i + 1) * 7 * 86400000).toLocaleDateString('en-IN'),
 reason: ['Resignation', 'Termination', 'Retirement'][i % 3],
 step: OFFBOARDING_STEPS[i % 5],
 status: i === 0 ? 'In Progress' : i === 1 ? 'Pending' : 'Completed',
 }));

 const columns: ColumnDef<OffboardRow>[] = [
 { key: 'name', label: 'Employee', sortable: true },
 { key: 'department', label: 'Department', sortable: true },
 { key: 'lastDay', label: 'Last Working Day', sortable: true },
 { key: 'reason', label: 'Reason', sortable: true },
 { key: 'step', label: 'Current Step', sortable: false },
 { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusPill label={v as string} /> },
 ];

 return (
 <div className="space-y-5 animate-rise">
 <PageTitle title="Offboarding" description="Manage employee exits, clearances and final settlements." />
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {[
 { label: 'Active Offboardings', value: offboardList.filter(o => o.status !== 'Completed').length, icon: <LogOut className="h-4 w-4 text-red-500" /> },
 { label: 'Exit Interviews Due', value: offboardList.filter(o => o.step === 'Exit Interview').length, icon: <FileText className="h-4 w-4 text-amber-500" /> },
 { label: 'Pending Clearance', value: offboardList.filter(o => o.step !== 'Clearance Certificate').length, icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> },
 { label: 'Completed This Month', value: offboardList.filter(o => o.status === 'Completed').length, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
 ].map((s) => (
 <GlassCard key={s.label}>
 <div className="flex items-start justify-between">
 <div><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-slate-900 ">{s.value}</p></div>
 <span className="p-2 rounded-xl bg-slate-100 ">{s.icon}</span>
 </div>
 </GlassCard>
 ))}
 </section>
 <DataTable
 title="Active Offboardings"
 columns={columns}
 data={offboardList}
 loading={loading}
 searchPlaceholder="Search employee..."
 exportFileName="offboarding"
 emptyMessage="No active offboardings. All employees are retained."
 actions={<PrimaryButton onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Initiate Offboarding</PrimaryButton>}
 />
 <GlassCard>
 <p className="text-sm font-semibold text-slate-800 mb-3">Offboarding Checklist</p>
 <div className="flex flex-col gap-2">
 {OFFBOARDING_STEPS.map((step, i) => (
 <div key={step} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 ">
 <span className="h-6 w-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs font-bold">{i + 1}</span>
 <span className="text-sm text-slate-700 ">{step}</span>
 </div>
 ))}
 </div>
 </GlassCard>
 <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Initiate Offboarding"
 loading={saving}
 footer={<><SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton loading={saving} onClick={async () => { setSaving(true); await new Promise(r => setTimeout(r, 600)); setSaving(false); setModalOpen(false); }}>Initiate</PrimaryButton></>}>
 <div className="space-y-4">
 <FieldGroup label="Employee" required>
 <ModalSelect value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
 <option value="">Select employee...</option>
 {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
 </ModalSelect>
 </FieldGroup>
 <FieldGroup label="Last Working Day" required><ModalInput type="date" value={form.lastDay} onChange={e => setForm({...form, lastDay: e.target.value})} /></FieldGroup>
 <FieldGroup label="Reason">
 <ModalSelect value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}>
 {['Resignation','Termination','Retirement','Contract End','Mutual Separation'].map(r => <option key={r} value={r}>{r}</option>)}
 </ModalSelect>
 </FieldGroup>
 <FieldGroup label="Notes"><ModalTextarea placeholder="Additional context..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></FieldGroup>
 </div>
 </FormModal>
 </div>
 );
}
