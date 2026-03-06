'use client';

import { Download, Eye } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { documentRecords } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { canPerformAction } from '@/utils/action-permissions';
import type { DocumentRecord } from '@/types/platform';
import { formatDateTime } from '@/utils/formatters';

const toDocumentCategory = (type: string): DocumentRecord['category'] => {
  const normalized = type.toLowerCase();

  if (normalized.includes('offer')) return 'Offer Letter';
  if (normalized.includes('experience')) return 'Experience Letter';
  if (normalized.includes('salary')) return 'Salary Slip';
  if (normalized.includes('id')) return 'ID Card';
  if (normalized.includes('visiting')) return 'Visiting Card';
  return 'Certificate';
};

const toDocumentStatus = (status: string): DocumentRecord['status'] => {
  const normalized = status.toLowerCase();

  if (normalized.includes('approve')) return 'Approved';
  if (normalized.includes('review')) return 'Pending Review';
  return 'Generated';
};

export function DocumentsModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);
  const canPreview = canPerformAction(activeRole, 'documents.preview');
  const canDownload = canPerformAction(activeRole, 'documents.download');

  const { data: records, isLive, loading, error } = useApiResource({
    loader: async () => {
      const rows = await platformApi.getDocuments();
      return rows.map((row) => ({
        id: row.id,
        name: row.documentName,
        category: toDocumentCategory(row.documentType),
        owner: 'Document Center',
        updatedAt: row.generatedAt ?? row.createdAt,
        status: toDocumentStatus(row.status),
      })) satisfies DocumentRecord[];
    },
    fallback: documentRecords,
  });

  return (
    <div className="space-y-5">
      <PageTitle
        title="Document Center"
        description="Manage offer letters, experience letters, salary slips, certificates, ID cards, and visiting cards."
      />

      <ModuleLinksBar
        links={[
          { label: 'Employees', href: `/employees?role=${activeRole}` },
          { label: 'Payroll', href: `/payroll?role=${activeRole}` },
          { label: 'Services', href: `/services?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {records.slice(0, 3).map((document) => (
          <GlassCard key={document.id}>
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">{document.category}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{document.name}</h3>
            <p className="mt-1 text-xs text-slate-500">Owner: {document.owner}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={!canPreview}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-200"
                title={canPreview ? 'Preview document' : 'Your role cannot preview documents.'}
              >
                <Eye size={12} />
                Preview
              </button>
              <button
                type="button"
                disabled={!canDownload}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 dark:bg-slate-100 dark:text-slate-900"
                title={canDownload ? 'Download document' : 'Your role cannot download documents.'}
              >
                <Download size={12} />
                Download
              </button>
            </div>
          </GlassCard>
        ))}
      </section>

      <section>
        <SimpleTable
          rows={records}
          columns={[
            { key: 'id', label: 'Document ID' },
            { key: 'name', label: 'Document Name' },
            { key: 'category', label: 'Category' },
            { key: 'owner', label: 'Owner' },
            {
              key: 'updatedAt',
              label: 'Updated',
              render: (document) => formatDateTime(document.updatedAt),
            },
            {
              key: 'status',
              label: 'Status',
              render: (document) => (
                <StatusPill
                  label={document.status}
                  tone={document.status === 'Approved' ? 'success' : document.status === 'Pending Review' ? 'warning' : 'default'}
                />
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
