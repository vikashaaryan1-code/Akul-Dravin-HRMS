'use client';

import { useMemo, useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApiResource } from '@/hooks/useApiResource';
import {
 platformApi,
 type DocumentApiRecord,
 type WorkflowApiRecord,
} from '@/services/api/platform-api';
import { documentRecords } from '@/services/platform-data';
import { useUIStore } from '@/store/ui-store';
import { canPerformAction } from '@/utils/action-permissions';
import { formatDateTime } from '@/utils/formatters';

type WorkflowStep = {
 code: string;
 label: string;
 owner: string;
 slaHours: number;
 output: string;
};

type InternshipPayload = {
 workflowCode?: string;
 workflowReference?: string;
 certificateNumber?: string;
 verificationCode?: string;
 internName?: string;
 candidateEmail?: string;
 internshipRole?: string;
 department?: string;
 university?: string;
 mentorName?: string;
 startDate?: string;
 endDate?: string;
 stipend?: string;
 projectTitle?: string;
 projectSummary?: string;
 projectHighlights?: string[];
 skillHighlights?: string[];
 approverName?: string;
 issueDate?: string;
};

type DocumentTableRow = {
 id: string;
 name: string;
 category: string;
 owner: string;
 updatedAt: string;
 status: string;
 subject: string;
 templateVersion: string;
};

type DocumentsModuleData = {
 documents: DocumentApiRecord[];
 workflows: WorkflowApiRecord[];
};

const defaultInternshipPayload: Record<string, unknown> = {
 internName: 'Aarav Sharma',
 candidateEmail: 'aarav.sharma@example.com',
 internshipRole: 'Frontend Engineering Intern',
 department: 'Product Engineering',
 university: 'IIT Patna',
 mentorName: 'Ruchi Malhotra',
 startDate: '2026-01-13',
 endDate: '2026-04-13',
 stipend: 'INR 18,000 per month',
 projectTitle: 'HRMS Workflow Hub',
 projectSummary: 'Automated internship packet preparation, review routing, and certificate dispatch.',
 projectHighlights: ['Prepared approval-ready packet', 'Generated certificate metadata', 'Drafted experience letter for review'],
 skillHighlights: ['Workflow automation', 'Documentation quality', 'Operations visibility'],
 approverName: 'Kavya Bansal',
};

const fallbackData: DocumentsModuleData = {
 documents: documentRecords.map((record) => ({
 id: record.id,
 documentType: record.category.toLowerCase().replace(/\s+/g, '-'),
 documentName: record.name,
 templateVersion: 'v1',
 status: record.status.toLowerCase().replace(/\s+/g, '-'),
 fileUrl: `/generated-documents/fallback/${record.id}.pdf`,
 documentPayload: {},
 generatedAt: record.updatedAt,
 createdAt: record.updatedAt,
 updatedAt: record.updatedAt,
 })),
 workflows: [
 {
 id: 'fallback-internship-workflow',
 workflowCode: 'internship-certificate-automation',
 name: 'Internship Certificate Automation',
 module: 'document-center',
 triggerType: 'manual-or-completion',
 status: 'active',
 successRate: '98.80',
 runCount: 12,
 workflowConfig: {
 steps: [
 { code: 'collect-details', label: 'Collect intern details', owner: 'HR Ops', slaHours: 2, output: 'Validated internship profile' },
 { code: 'generate-packet', label: 'Generate offer and certificate packet', owner: 'Document Center', slaHours: 1, output: 'Offer letter + certificate + experience draft' },
 { code: 'review-approvals', label: 'Run approval chain', owner: 'HR Manager', slaHours: 4, output: 'Approver sign-off and verification metadata' },
 { code: 'dispatch-documents', label: 'Dispatch to intern and mentor', owner: 'Automation Desk', slaHours: 1, output: 'Email, portal, and audit trail updated' },
 ],
 },
 lastRunAt: '2026-04-12T10:15:00.000Z',
 createdAt: '2026-04-01T09:00:00.000Z',
 updatedAt: '2026-04-12T10:15:00.000Z',
 },
 ],
};

const toDocumentCategory = (type: string): string => {
 const normalized = type.toLowerCase();

 if (normalized.includes('internship') && normalized.includes('offer')) return 'Internship Offer';
 if (normalized.includes('internship') && normalized.includes('experience')) return 'Internship Experience';
 if (normalized.includes('internship') && normalized.includes('certificate')) return 'Internship Certificate';
 if (normalized.includes('offer')) return 'Offer Letter';
 if (normalized.includes('experience')) return 'Experience Letter';
 if (normalized.includes('salary')) return 'Salary Slip';
 if (normalized.includes('id')) return 'ID Card';
 if (normalized.includes('visiting')) return 'Visiting Card';
 return 'Certificate';
};

const toDocumentStatus = (status: string): string => {
 const normalized = status.toLowerCase();

 if (normalized.includes('reject')) return 'Rejected';
 if (normalized.includes('archive')) return 'Archived';
 if (normalized.includes('approve')) return 'Approved';
 if (normalized.includes('review')) return 'Pending Review';
 return 'Generated';
};

const toStatusTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
 const normalized = status.toLowerCase();

 if (normalized.includes('approve')) return 'success';
 if (normalized.includes('review')) return 'warning';
 if (normalized.includes('reject') || normalized.includes('archive')) return 'danger';
 return 'default';
};

const formatDate = (value?: string | null) =>
 value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Pending';

const getInternshipPayload = (document?: DocumentApiRecord | null): InternshipPayload | null => {
 if (!document || typeof document.documentPayload !== 'object' || document.documentPayload === null) {
 return null;
 }

 return document.documentPayload as InternshipPayload;
};

const getWorkflowSteps = (workflow?: WorkflowApiRecord | null): WorkflowStep[] => {
 const rawSteps = workflow?.workflowConfig?.steps;

 if (!Array.isArray(rawSteps)) {
 return [];
 }

 return rawSteps
 .filter((step): step is Record<string, unknown> => typeof step === 'object' && step !== null)
 .map((step, index) => ({
 code: typeof step.code === 'string' ? step.code : `step-${index + 1}`,
 label: typeof step.label === 'string' ? step.label : `Step ${index + 1}`,
 owner: typeof step.owner === 'string' ? step.owner : 'Automation Desk',
 slaHours: typeof step.slaHours === 'number' ? step.slaHours : Number(step.slaHours) || 0,
 output: typeof step.output === 'string' ? step.output : 'Workflow output',
 }));
};

export function DocumentsModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);
 const canPreview = canPerformAction(activeRole, 'documents.preview');
 const canDownload = canPerformAction(activeRole, 'documents.download');
 const [actionState, setActionState] = useState<'workflow' | 'certificate' | null>(null);
 const [message, setMessage] = useState<string | null>(null);

 const { data, isLive, loading, error, refresh } = useApiResource<DocumentsModuleData>({
 loader: async () => {
 const [documents, workflows] = await Promise.all([
 platformApi.getDocuments(),
 platformApi.getWorkflows(),
 ]);

 return {
 documents,
 workflows,
 };
 },
 fallback: fallbackData,
 });

 const records = useMemo<DocumentTableRow[]>(
 () =>
 data.documents.map((row) => {
 const payload = getInternshipPayload(row);

 return {
 id: row.id,
 name: row.documentName,
 category: toDocumentCategory(row.documentType),
 owner: payload?.approverName ?? payload?.mentorName ?? 'Document Center',
 updatedAt: row.generatedAt ?? row.updatedAt ?? row.createdAt,
 status: toDocumentStatus(row.status),
 subject: payload?.internName ?? payload?.projectTitle ?? 'Standard document',
 templateVersion: row.templateVersion,
 };
 }),
 [data.documents],
 );

 const internshipWorkflow = useMemo(
 () => data.workflows.find((workflow) => workflow.workflowCode === 'internship-certificate-automation') ?? null,
 [data.workflows],
 );
 const workflowSteps = useMemo(() => getWorkflowSteps(internshipWorkflow), [internshipWorkflow]);
 const latestPacketDocument = useMemo(
 () => data.documents.find((document) => Boolean(getInternshipPayload(document)?.internName)) ?? null,
 [data.documents],
 );
 const latestPacket = getInternshipPayload(latestPacketDocument);

 const summary = useMemo(
 () => ({
 totalDocuments: data.documents.length,
 internshipCertificates: data.documents.filter((document) => document.documentType.toLowerCase().includes('certificate')).length,
 pendingReview: data.documents.filter((document) => document.status.toLowerCase().includes('review')).length,
 workflowGenerated: data.documents.filter((document) => Boolean(getInternshipPayload(document)?.workflowCode)).length,
 }),
 [data.documents],
 );

 const runInternshipWorkflow = async () => {
 if (!internshipWorkflow) {
 setMessage('Internship certificate workflow is not available yet.');
 return;
 }

 setActionState('workflow');
 setMessage(null);

 try {
 const result = await platformApi.triggerWorkflow(internshipWorkflow.id, {
 triggerReason: 'manual internship packet generation',
 payload: defaultInternshipPayload,
 });
 await refresh();
 setMessage(`${result.documents.length} internship documents generated for ${String(result.workflowSummary.internName ?? 'the current intern')}.`);
 } catch (caught) {
 setMessage(caught instanceof Error ? caught.message : 'Unable to run the internship workflow.');
 } finally {
 setActionState(null);
 }
 };

 const generateCertificate = async () => {
 setActionState('certificate');
 setMessage(null);

 try {
 const created = await platformApi.generateCertificate({
 documentName: 'Internship Completion Certificate - Aarav Sharma',
 templateVersion: 'v4',
 payload: {
 ...defaultInternshipPayload,
 certificateNumber: 'AD-CERT-20260413-900',
 verificationCode: 'VERIFY-INT-9000',
 issueDate: '2026-04-13',
 },
 });
 await refresh();
 setMessage(`${created.documentName} generated with certificate metadata.`);
 } catch (caught) {
 setMessage(caught instanceof Error ? caught.message : 'Unable to generate the certificate.');
 } finally {
 setActionState(null);
 }
 };

 return (
 <div className="space-y-5">
 <PageTitle
 title="Document Center"
 description="Run the internship packet automatically and keep every certificate detail, approval field, and workflow step visible in one place."
 actions={
 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => void runInternshipWorkflow()}
 disabled={actionState !== null || loading}
 className="rounded-md bg-ink px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
 >
 {actionState === 'workflow' ? 'Running...' : 'Run Internship Workflow'}
 </button>
 <button
 type="button"
 onClick={() => void generateCertificate()}
 disabled={actionState !== null || loading}
 className="rounded-md bg-aqua px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
 >
 {actionState === 'certificate' ? 'Generating...' : 'Generate Certificate'}
 </button>
 </div>
 }
 />

 <ModuleLinksBar
 links={[
 { label: 'Employees', href: `/employees?role=${activeRole}` },
 { label: 'Automation', href: `/automation?role=${activeRole}` },
 { label: 'Services', href: `/services?role=${activeRole}` },
 ]}
 isLive={isLive}
 loading={loading}
 error={error}
 />

 {message ? (
 <p className="rounded-lg border border-aqua/30 bg-aqua/10 px-4 py-3 text-sm text-aqua ">
 {message}
 </p>
 ) : null}

 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Document Vault</p>
 <p className="mt-2 text-2xl font-semibold text-slate-900 ">{summary.totalDocuments}</p>
 <p className="mt-1 text-xs text-slate-500">Live records available for review</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Certificates</p>
 <p className="mt-2 text-2xl font-semibold text-slate-900 ">{summary.internshipCertificates}</p>
 <p className="mt-1 text-xs text-slate-500">Internship certificate records on file</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Pending Review</p>
 <p className="mt-2 text-2xl font-semibold text-slate-900 ">{summary.pendingReview}</p>
 <p className="mt-1 text-xs text-slate-500">Documents still waiting for sign-off</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Workflow Generated</p>
 <p className="mt-2 text-2xl font-semibold text-slate-900 ">{summary.workflowGenerated}</p>
 <p className="mt-1 text-xs text-slate-500">Records carrying automation metadata</p>
 </GlassCard>
 </section>

 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
 {records.slice(0, 3).map((document) => (
 <GlassCard key={document.id}>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">{document.category}</p>
 <h3 className="mt-2 text-lg font-semibold text-slate-900 ">{document.name}</h3>
 <p className="mt-1 text-xs text-slate-500">Owner: {document.owner}</p>
 <p className="mt-1 text-xs text-slate-500">Subject: {document.subject}</p>
 <div className="mt-3 flex items-center gap-2">
 <button
 type="button"
 disabled={!canPreview}
 className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45 "
 title={canPreview ? 'Preview document' : 'Your role cannot preview documents.'}
 >
 <Eye size={12} />
 Preview
 </button>
 <button
 type="button"
 disabled={!canDownload}
 className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 "
 title={canDownload ? 'Download document' : 'Your role cannot download documents.'}
 >
 <Download size={12} />
 Download
 </button>
 </div>
 </GlassCard>
 ))}
 </section>

 <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
 <GlassCard>
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <p className="text-sm font-semibold text-slate-800 ">Latest Internship Packet</p>
 <p className="mt-1 text-sm text-slate-600 ">
 {latestPacket?.internName
 ? `${latestPacket.internName} • ${latestPacket.internshipRole ?? 'Internship role'}`
 : 'Run the workflow to create an internship packet with full detail metadata.'}
 </p>
 </div>
 {latestPacket?.verificationCode ? (
 <StatusPill label={latestPacket.verificationCode} tone="success" />
 ) : null}
 </div>

 <div className="mt-4 grid gap-3 sm:grid-cols-2">
 <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">University</p>
 <p className="mt-2 text-sm font-semibold text-slate-900 ">{latestPacket?.university ?? 'Ready for next packet'}</p>
 </div>
 <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Mentor</p>
 <p className="mt-2 text-sm font-semibold text-slate-900 ">{latestPacket?.mentorName ?? 'Waiting for assignment'}</p>
 </div>
 <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Internship Window</p>
 <p className="mt-2 text-sm font-semibold text-slate-900 ">
 {latestPacket?.startDate && latestPacket?.endDate ? `${formatDate(latestPacket.startDate)} to ${formatDate(latestPacket.endDate)}` : 'Dates arrive with the workflow packet'}
 </p>
 </div>
 <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Approver</p>
 <p className="mt-2 text-sm font-semibold text-slate-900 ">{latestPacket?.approverName ?? 'HR Manager queue'}</p>
 </div>
 </div>

 <div className="mt-4 space-y-2 text-sm text-slate-600 ">
 <p>{latestPacket?.projectSummary ?? 'The automation payload stores project summary, certificate number, verification code, and dispatch data.'}</p>
 {latestPacket?.projectHighlights?.length ? (
 <ul className="space-y-2">
 {latestPacket.projectHighlights.map((highlight) => (
 <li key={highlight} className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 {highlight}
 </li>
 ))}
 </ul>
 ) : null}
 </div>
 </GlassCard>

 <GlassCard>
 <p className="text-sm font-semibold text-slate-800 ">Workflow Steps</p>
 <div className="mt-4 space-y-3">
 {workflowSteps.length > 0 ? workflowSteps.map((step) => (
 <div key={step.code} className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <p className="text-sm font-semibold text-slate-900 ">{step.label}</p>
 <span className="text-xs uppercase tracking-[0.12em] text-slate-500">{step.slaHours}h SLA</span>
 </div>
 <p className="mt-1 text-xs text-slate-500">Owner: {step.owner}</p>
 <p className="mt-2 text-sm text-slate-600 ">{step.output}</p>
 </div>
 )) : (
 <p className="text-sm text-slate-600 ">Workflow steps will appear once the live automation module responds.</p>
 )}
 </div>
 </GlassCard>
 </section>

 <section>
 <SimpleTable
 rows={records}
 columns={[
 { key: 'id', label: 'Document ID' },
 { key: 'name', label: 'Document Name' },
 { key: 'category', label: 'Category' },
 { key: 'subject', label: 'Subject' },
 { key: 'owner', label: 'Owner' },
 {
 key: 'updatedAt',
 label: 'Updated',
 render: (document) => formatDateTime(document.updatedAt),
 },
 {
 key: 'status',
 label: 'Status',
 render: (document) => <StatusPill label={document.status} tone={toStatusTone(document.status)} />,
 },
 { key: 'templateVersion', label: 'Template' },
 ]}
 />
 </section>
 </div>
 );
}
