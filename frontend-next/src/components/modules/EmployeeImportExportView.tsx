'use client';

import { useState, useCallback, useRef } from 'react';
import {
 Upload, Download, CheckCircle2, XCircle, AlertTriangle,
 FileSpreadsheet, RefreshCw, Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { StatusPill } from '@/components/ui/StatusPill';
import { toast } from '@/store/toast-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';
const authHeader = () => ({
 Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('hrms_token') ?? '' : ''}`,
});

type RowStatus = 'valid' | 'invalid' | 'duplicate';

interface ImportRow {
 rowIndex: number;
 data: Record<string, string>;
 errors: string[];
 status: RowStatus;
}

interface PreviewResult {
 totalRows: number;
 validRows: number;
 invalidRows: number;
 duplicateRows: number;
 rows: ImportRow[];
}

/* ── Status badge colours ────────────────────────────────────────────────────── */ const rowColors: Record<RowStatus, string> = {
 valid: 'bg-emerald-50 border-emerald-200 ',
 invalid: 'bg-red-50 border-red-200 ',
 duplicate: 'bg-amber-50 border-amber-200 ',
};

const rowIcon: Record<RowStatus, React.ReactNode> = {
 valid: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
 invalid: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
 duplicate: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
};

/* ── CSV template ────────────────────────────────────────────────────────────── */ const CSV_TEMPLATE = [
 'employeeCode,firstName,lastName,workEmail,department,designation,monthlyCtc,dateOfJoining,managerId,attendancePolicy,payrollGroup,status',
 'EMP-001,Meera,Joshi,meera.joshi@company.com,Sales,Senior Executive,85000,2026-01-15,,Standard,Monthly,active',
 'EMP-002,Ravi,Kumar,ravi.kumar@company.com,Engineering,Software Engineer,120000,2026-02-01,,Flexible,Monthly,active',
].join('\r\n');

export function EmployeeImportExportView() {
 const [step, setStep] = useState<'idle' | 'preview' | 'submitting' | 'done'>('idle');
 const [dragging, setDragging] = useState(false);
 const [preview, setPreview] = useState<PreviewResult | null>(null);
 const [jobId, setJobId] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [exporting, setExporting] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);

 /* ── Upload & Preview ─────────────────────────────────────────────────────── */ const handleFile = useCallback(async (file: File) => {
 if (!file.name.endsWith('.csv')) {
 toast.error('Only .csv files are accepted');
 return;
 }
 setLoading(true);
 try {
 const form = new FormData();
 form.append('file', file);
 const res = await fetch(`${API}/api/v1/employees/import/preview`, {
 method: 'POST',
 headers: authHeader(),
 body: form,
 });
 const body = await res.json();
 if (!res.ok) throw new Error(body.error ?? 'Preview failed');
 setPreview(body.data ?? body);
 setStep('preview');
 } catch (err: any) {
 toast.error(err.message ?? 'Could not parse CSV');
 } finally {
 setLoading(false);
 }
 }, []);

 const onDrop = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setDragging(false);
 const file = e.dataTransfer.files[0];
 if (file) handleFile(file);
 }, [handleFile]);

 /* ── Submit Import ────────────────────────────────────────────────────────── */ const handleSubmit = async () => {
 if (!preview) return;
 setStep('submitting');
 try {
 const validRows = preview.rows.filter(r => r.status === 'valid');
 const res = await fetch(`${API}/api/v1/employees/import/submit`, {
 method: 'POST',
 headers: { ...authHeader(), 'Content-Type': 'application/json' },
 body: JSON.stringify({ rows: validRows }),
 });
 const body = await res.json();
 if (!res.ok) throw new Error(body.error ?? 'Import submission failed');
 setJobId(body.data?.jobId ?? body.jobId ?? null);
 setStep('done');
 toast.success(`Import queued! ${validRows.length} employees will be imported.`);
 } catch (err: any) {
 toast.error(err.message);
 setStep('preview');
 }
 };

 /* ── Export CSV ──────────────────────────────────────────────────────────── */ const handleExport = async () => {
 setExporting(true);
 try {
 const res = await fetch(`${API}/api/v1/employees/export/csv`, {
 headers: authHeader(),
 });
 if (!res.ok) throw new Error('Export failed');
 const blob = await res.blob();
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `employees-export-${new Date().toISOString().slice(0, 10)}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 toast.success('CSV exported successfully');
 } catch (err: any) {
 toast.error(err.message ?? 'Export failed');
 } finally {
 setExporting(false);
 }
 };

 /* ── Template Download ───────────────────────────────────────────────────── */ const downloadTemplate = () => {
 const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = 'employee-import-template.csv';
 a.click();
 URL.revokeObjectURL(url);
 };

 /* ───────────────────────────────────────────────────────────────────────── */ return (
 <div className="space-y-5 animate-rise">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <PageTitle title="Import & Export" description="Bulk employee data operations — CSV import with validation preview and filtered export." />
 <div className="flex gap-2">
 <SecondaryButton onClick={downloadTemplate}>
 <FileSpreadsheet className="h-3.5 w-3.5" /> Download Template
 </SecondaryButton>
 <PrimaryButton onClick={handleExport} loading={exporting}>
 <Download className="h-3.5 w-3.5" /> Export CSV
 </PrimaryButton>
 </div>
 </div>

 {/* Step 1: Drop Zone */}
 {step === 'idle' && (
 <GlassCard>
 <div
 className={`rounded-3xl border-2 border-dashed p-12 text-center transition cursor-pointer
 ${dragging ? 'border-blue-400 bg-blue-50/30 ' : 'border-slate-300 hover:border-blue-400'}`}
 onDragOver={e => { e.preventDefault(); setDragging(true); }}
 onDragLeave={() => setDragging(false)}
 onDrop={onDrop}
 onClick={() => fileInputRef.current?.click()}
 >
 {loading ? (
 <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
 ) : (
 <Upload className="h-10 w-10 mx-auto text-slate-500" />
 )}
 <p className="mt-4 text-lg font-semibold text-slate-700 ">
 {loading ? 'Parsing CSV...' : 'Drop your CSV here or click to browse'}
 </p>
 <p className="mt-2 text-sm text-slate-500">Accepts .csv files up to 10 MB</p>
 <input
 ref={fileInputRef}
 type="file"
 accept=".csv"
 className="hidden"
 onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
 />
 </div>
 </GlassCard>
 )}

 {/* Step 2: Preview Report */}
 {(step === 'preview' || step === 'submitting') && preview && (
 <>
 {/* Summary Strip */}
 <GlassCard>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 {[
 { label: 'Total Rows', value: preview.totalRows, color: 'text-slate-700 ' },
 { label: '✅ Valid', value: preview.validRows, color: 'text-emerald-600 ' },
 { label: '❌ Invalid', value: preview.invalidRows, color: 'text-red-600 ' },
 { label: '⚠️ Duplicate', value: preview.duplicateRows, color: 'text-amber-600 ' },
 ].map(s => (
 <div key={s.label} className="text-center">
 <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
 <p className="mt-1 text-xs text-slate-500 ">{s.label}</p>
 </div>
 ))}
 </div>

 <div className="mt-5 flex gap-3 justify-end">
 <SecondaryButton onClick={() => { setStep('idle'); setPreview(null); }}>
 <RefreshCw className="h-3.5 w-3.5" /> Start Over
 </SecondaryButton>
 <PrimaryButton
 onClick={handleSubmit}
 loading={step === 'submitting'}
 disabled={preview.validRows === 0}
 >
 Import {preview.validRows} Valid Employees
 </PrimaryButton>
 </div>
 </GlassCard>

 {/* Row Details */}
 <GlassCard>
 <p className="text-sm font-semibold text-slate-700 mb-3">Row-by-Row Validation</p>
 <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
 {preview.rows.map(row => (
 <div
 key={row.rowIndex}
 className={`rounded-2xl border p-3 flex items-start gap-3 ${rowColors[row.status]}`}
 >
 {rowIcon[row.status]}
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-slate-700 ">
 Row {row.rowIndex} — {row.data['firstName']} {row.data['lastName']} ({row.data['workEmail']})
 </p>
 {row.errors.length > 0 && (
 <ul className="mt-1 space-y-0.5">
 {row.errors.map(err => (
 <li key={err} className="text-xs text-red-600 ">{err}</li>
 ))}
 </ul>
 )}
 </div>
 <StatusPill label={row.status} />
 </div>
 ))}
 </div>
 </GlassCard>
 </>
 )}

 {/* Step 3: Done */}
 {step === 'done' && (
 <GlassCard>
 <div className="text-center py-8 space-y-4">
 <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
 <h2 className="text-2xl font-semibold text-slate-800 ">Import Queued!</h2>
 {jobId && (
 <p className="text-sm text-slate-500 ">Job ID: <code className="font-mono">{jobId}</code></p>
 )}
 <p className="text-sm text-slate-500 ">
 Employees are being imported in the background. You will be notified when complete.
 </p>
 <PrimaryButton onClick={() => { setStep('idle'); setPreview(null); setJobId(null); }}>
 Import Another File
 </PrimaryButton>
 </div>
 </GlassCard>
 )}
 </div>
 );
}
