'use client';

import { useState } from 'react';
import { Receipt, TrendingUp, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, ModalSelect, ModalTextarea, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useFinanceExpenses } from '@/hooks/useDomainData';

const CATEGORIES = ['Travel', 'Meals', 'Software', 'Hardware', 'Training', 'Marketing', 'Utilities', 'Office Supplies', 'Other'];

export function ExpenseModuleView() {
 const { expenses, loading, refresh } = useFinanceExpenses();
 const [modalOpen, setModalOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState({ title: '', amount: '', category: 'Travel', description: '' });

 const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
 const pendingExpenses = expenses.filter((e: any) => e.status === 'Pending');
 const pendingAmount = pendingExpenses.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
 const approvedCount = expenses.filter((e: any) => e.status === 'Approved').length;

 const columns: ColumnDef<Record<string, unknown>>[] = [
 { key: 'title', label: 'Description', sortable: true },
 { key: 'category', label: 'Category', sortable: true, render: (v) => <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">{v as string}</span> },
 { key: 'amount', label: 'Amount', sortable: true, render: (v) => <span className="font-semibold text-slate-800 ">₹{Number(v).toLocaleString('en-IN')}</span> },
 { key: 'submittedBy', label: 'Employee', sortable: true },
 { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusPill label={v as string} /> },
 { key: 'createdAt', label: 'Date', sortable: true, render: (v) => v ? new Date(v as string).toLocaleDateString('en-IN') : '—' },
 ];

 const handleSubmit = async () => {
 setSaving(true);
 await new Promise(r => setTimeout(r, 700));
 setSaving(false);
 setModalOpen(false);
 setForm({ title: '', amount: '', category: 'Travel', description: '' });
 refresh();
 };

 return (
 <div className="space-y-5 animate-rise">
 <PageTitle title="Expense Claims" description="Track, submit and approve employee expense reimbursements." />
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {[
 { label: 'Total Expenses', value: `₹${(totalExpenses / 1000).toFixed(1)}K`, icon: <Receipt className="h-4 w-4 text-blue-500" /> },
 { label: 'Total Claims', value: expenses.length, icon: <TrendingUp className="h-4 w-4 text-violet-500" /> },
 { label: 'Pending Approval', value: `₹${(pendingAmount / 1000).toFixed(1)}K`, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
 { label: 'Approved This Month', value: approvedCount, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
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
 title="Expense Claims"
 columns={columns}
 data={expenses as Record<string, unknown>[]}
 loading={loading}
 searchPlaceholder="Search expense..."
 exportFileName="expenses"
 emptyMessage="No expense claims found."
 actions={<PrimaryButton onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Submit Expense</PrimaryButton>}
 />
 <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Submit Expense Claim"
 loading={saving}
 footer={<><SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton loading={saving} onClick={handleSubmit}>Submit Claim</PrimaryButton></>}>
 <div className="space-y-4">
 <FieldGroup label="Expense Title" required><ModalInput placeholder="e.g. Client dinner at Mumbai" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></FieldGroup>
 <div className="grid grid-cols-2 gap-3">
 <FieldGroup label="Amount (₹)" required><ModalInput type="number" placeholder="2500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></FieldGroup>
 <FieldGroup label="Category">
 <ModalSelect value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
 </ModalSelect>
 </FieldGroup>
 </div>
 <FieldGroup label="Description"><ModalTextarea placeholder="Add context about this expense..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></FieldGroup>
 <FieldGroup label="Receipt Upload"><ModalInput type="file" accept="image/*,.pdf" /></FieldGroup>
 </div>
 </FormModal>
 </div>
 );
}
