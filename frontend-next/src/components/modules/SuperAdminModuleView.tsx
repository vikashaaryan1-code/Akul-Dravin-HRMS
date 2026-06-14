'use client';

import { useState } from 'react';
import { Building2, Users, CreditCard, ShieldAlert, Globe, Plus, MoreVertical, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, ModalSelect, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi } from '@/services/api/platform-api';

type Tenant = { id: string; slug: string; companyName: string; ownerEmail: string; status: string; plan: string; seatLimit: number; seatUsed: number; createdAt: string };

export function SuperAdminModuleView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ companyName: '', ownerEmail: '', ownerName: '', plan: 'starter', seatLimit: '10' });

  const { data: tenants, loading, refresh } = useApiResource<Tenant[]>({
    loader: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/admin/tenants`, {
      headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : ''}` }
    }).then(r => r.json()),
    fallback: [],
    label: 'Tenants',
    errorToast: false,
  });

  const { data: stats } = useApiResource({
    loader: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/admin/tenants/stats`, {
      headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : ''}` }
    }).then(r => r.json()),
    fallback: { total: 0, active: 0, trial: 0, suspended: 0, planBreakdown: [] },
    label: 'Stats',
    errorToast: false,
  });

  const columns: ColumnDef<Tenant>[] = [
    { key: 'companyName', label: 'Company', sortable: true },
    { key: 'ownerEmail', label: 'Owner Email', sortable: true },
    { key: 'plan', label: 'Plan', sortable: true, render: (v) => {
      const colors: Record<string, string> = { starter: 'text-slate-600 bg-slate-100', growth: 'text-blue-600 bg-blue-50', enterprise: 'text-amber-600 bg-amber-50', custom: 'text-violet-600 bg-violet-50' };
      return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[v as string] ?? ''}`}>{v as string}</span>;
    }},
    { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusPill label={v as string} /> },
    { key: 'seatUsed', label: 'Seats', sortable: true, render: (v, row) => <span className="text-xs"><span className="font-semibold">{row.seatUsed}</span>/{row.seatLimit}</span> },
    { key: 'createdAt', label: 'Created', sortable: true, render: (v) => new Date(v as string).toLocaleDateString('en-IN') },
  ];

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/admin/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('hrms_token')}` },
        body: JSON.stringify({ ...form, seatLimit: parseInt(form.seatLimit) }),
      });
      refresh();
      setModalOpen(false);
      setForm({ companyName: '', ownerEmail: '', ownerName: '', plan: 'starter', seatLimit: '10' });
    } finally {
      setSaving(false);
    }
  };

  const statsTyped = stats as { total: number; active: number; trial: number; suspended: number };

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-red-500" />
        <PageTitle title="Super Admin" description="Global tenant management — create, monitor, suspend and configure all tenants." />
      </div>

      <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 font-medium">
        ⚠️ Root-only access zone. All actions are audit-logged and irreversible.
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Tenants', value: statsTyped.total || tenants.length, icon: <Building2 className="h-4 w-4 text-blue-500" /> },
          { label: 'Active', value: statsTyped.active || tenants.filter(t=>t.status==='active').length, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
          { label: 'Trial', value: statsTyped.trial || tenants.filter(t=>t.status==='trial').length, icon: <Clock className="h-4 w-4 text-amber-500" /> },
          { label: 'Suspended', value: statsTyped.suspended || tenants.filter(t=>t.status==='suspended').length, icon: <XCircle className="h-4 w-4 text-red-500" /> },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p></div>
              <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">{s.icon}</span>
            </div>
          </GlassCard>
        ))}
      </section>

      <DataTable
        title="All Tenants"
        columns={columns}
        data={tenants}
        loading={loading}
        searchPlaceholder="Search company or email..."
        exportFileName="tenants"
        emptyMessage="No tenants found. Create the first tenant organization."
        actions={<PrimaryButton onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Create Tenant</PrimaryButton>}
      />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New Tenant"
        subtitle="Provision a new organization on the platform"
        loading={saving} maxWidth="lg"
        footer={<><SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton loading={saving} onClick={handleCreate}>Create Tenant</PrimaryButton></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><FieldGroup label="Company Name" required><ModalInput placeholder="Acme Corp Ltd." value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} /></FieldGroup></div>
          <FieldGroup label="Owner Email" required><ModalInput type="email" placeholder="admin@acme.com" value={form.ownerEmail} onChange={e => setForm({...form, ownerEmail: e.target.value})} /></FieldGroup>
          <FieldGroup label="Owner Name"><ModalInput placeholder="John Doe" value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} /></FieldGroup>
          <FieldGroup label="Plan"><ModalSelect value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}>{['starter','growth','enterprise','custom'].map(p=><option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</ModalSelect></FieldGroup>
          <FieldGroup label="Seat Limit"><ModalInput type="number" value={form.seatLimit} onChange={e => setForm({...form, seatLimit: e.target.value})} /></FieldGroup>
        </div>
      </FormModal>
    </div>
  );
}
