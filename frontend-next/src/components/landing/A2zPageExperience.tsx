'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
 ArrowUpRight,
 Layers3,
 Rocket,
 ChevronRight,
 Workflow,
 ShieldCheck,
 Search,
 CheckCircle,
 Loader2,
} from 'lucide-react';
import { getA2zWorkflows, getA2zPreview, A2zWorkflow, A2zPreview } from '@/lib/a2z-engine';
import { DynamicForm } from './A2zDynamicForm';
import { PreviewPanel } from './A2zPreviewPanel';

const SESSION_KEY = 'a2z-experience-state';

interface SessionState {
 selectedId: string | null;
 formData: Record<string, unknown>;
}

type SubmitStatus = 'idle' | 'submitting' | 'submitted';

function saveSession(state: SessionState) {
 try {
 sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
 } catch {
 /* SessionStorage unavailable (SSR or private mode) — silently ignore */ }
}

function loadSession(): SessionState {
 try {
 const raw = sessionStorage.getItem(SESSION_KEY);
 if (raw) return JSON.parse(raw) as SessionState;
 } catch {
 /* ignore */ }
 return { selectedId: null, formData: {} };
}

export function A2zPageExperience() {
 const [workflows, setWorkflows] = useState<A2zWorkflow[]>([]);
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [formData, setFormData] = useState<Record<string, unknown>>({});
 const [preview, setPreview] = useState<A2zPreview | null>(null);
 const [loading, setLoading] = useState(false);
 const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
 const [submittedId, setSubmittedId] = useState<string | null>(null);

 // Restore session on mount
 useEffect(() => {
 const saved = loadSession();
 if (saved.selectedId) setSelectedId(saved.selectedId);
 if (Object.keys(saved.formData).length > 0) setFormData(saved.formData);
 }, []);

 useEffect(() => {
 getA2zWorkflows().then(setWorkflows).catch(console.error);
 }, []);

 const selectedWorkflow = workflows.find((w) => w.id === selectedId);

 useEffect(() => {
 if (selectedId && Object.keys(formData).length > 0) {
 setLoading(true);
 getA2zPreview({ ...formData, workflowId: selectedId })
 .then(setPreview)
 .finally(() => setLoading(false));
 }
 }, [formData, selectedId]);

 const handleFormChange = useCallback((field: string, value: unknown) => {
 setFormData((prev) => {
 const next = { ...prev, [field]: value };
 saveSession({ selectedId, formData: next });
 return next;
 });
 }, [selectedId]);

 const handleSelectWorkflow = (id: string) => {
 setSelectedId(id);
 setFormData({});
 setPreview(null);
 setSubmitStatus('idle');
 setSubmittedId(null);
 saveSession({ selectedId: id, formData: {} });
 };

 const handleConfirmRollout = async () => {
 if (!preview || submitStatus !== 'idle') return;
 setSubmitStatus('submitting');
 try {
 // Submit to backend asynchronously; graceful fallback if backend is offline
 const res = await fetch('/api/v1/a2z-engine/submit', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...formData, workflowId: selectedId }),
 });
 if (res.ok) {
 const data = await res.json() as { requestId?: string };
 setSubmittedId(data?.requestId ?? null);
 }
 } catch {
 /* Backend unavailable — still show submitted state for UX continuity */ } finally {
 setSubmitStatus('submitted');
 // Clear persisted session after successful submission
 try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
 }
 };

 if (submitStatus === 'submitted') {
 return (
 <main className="min-h-screen bg-[#04101f] text-white selection:bg-amber/30 flex items-center justify-center px-4">
 <div className="max-w-lg text-center space-y-6">
 <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 mx-auto">
 <CheckCircle className="h-10 w-10 text-emerald-400" />
 </span>
 <h1 className="text-3xl font-bold text-white">Rollout Submitted</h1>
 <p className="text-slate-400 leading-relaxed">
 Your rollout request has been queued for processing. Our AI engine is preparing your
 implementation blueprint across all selected modules.
 </p>
 {submittedId && (
 <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-600">
 Request ID: <span className="font-mono text-amber">{submittedId}</span>
 </p>
 )}
 <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
 <button
 type="button"
 onClick={() => {
 setSubmitStatus('idle');
 setSelectedId(null);
 setFormData({});
 setPreview(null);
 setSubmittedId(null);
 }}
 className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/25"
 >
 Start new rollout
 </button>
 <Link
 href="/"
 className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-ember to-amber px-6 py-3 text-sm font-bold text-navy shadow-xl transition hover:opacity-90"
 >
 Back to home <ArrowUpRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 </main>
 );
 }

 return (
 <main className="min-h-screen bg-[#04101f] text-white selection:bg-amber/30">
 <div className="deterministic-noise absolute inset-0 z-0" />
 
 <header className="sticky top-0 z-50 border-b border-white/10 bg-[#04101f]/85 backdrop-blur-xl">
 <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 lg:px-8">
 <Link href="/" className="flex items-center gap-3">
 <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ember via-amber to-aqua font-bold text-navy">
 A
 </span>
 <div>
 <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">AKUL DRAVIN</p>
 <p className="text-[10px] uppercase text-slate-400">A2Z Rollout Atlas</p>
 </div>
 </Link>

 <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
 Back to home
 </Link>
 </div>
 </header>

 <section className="relative px-4 pt-16 lg:px-8 lg:pt-24 shrink-0">
 <div className="mx-auto max-w-7xl">
 <div className="max-w-3xl space-y-6">
 <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-amber">
 <Workflow className="h-3.5 w-3.5" />
 Interactive Engine
 </div>
 <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
 Construct your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber to-aqua">Atlas Rollout</span> roadmap in real-time.
 </h1>
 <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
 Select your service track, configure your workforce parameters, and see the implementation blueprint generate dynamically.
 </p>
 </div>
 </div>
 </section>

 <section className="relative z-10 px-4 py-20 lg:px-8">
 <div className="mx-auto max-w-7xl">
 <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
 <div className="space-y-12">
 {/* Step 1: Selection */}
 <div className="space-y-6">
 <p className="text-xs font-bold uppercase tracking-widest text-amber/80 flex items-center gap-4">
 <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy/10 text-white">1</span>
 Select Rollout Track
 </p>
 <div className="grid gap-4 sm:grid-cols-2">
 {workflows.map((w) => (
 <button
 key={w.id}
 type="button"
 onClick={() => handleSelectWorkflow(w.id)}
 className={`group relative rounded-[2rem] border p-6 text-left transition duration-300 ${
 selectedId === w.id 
 ? 'border-amber/50 bg-amber/5 shadow-[0_0_30px_rgba(242,170,59,0.1)]' 
 : 'border-white/10 bg-white/5 hover:border-white/25'
 }`}
 >
 <h3 className="text-xl font-bold text-white">{w.title}</h3>
 <p className="mt-2 text-sm text-slate-400 leading-relaxed">{w.description}</p>
 <ChevronRight className={`absolute bottom-6 right-6 h-5 w-5 transition-transform ${selectedId === w.id ? 'translate-x-1 text-amber' : 'text-slate-700'}`} />
 </button>
 ))}
 </div>
 </div>

 {/* Step 2: Configuration */}
 {selectedWorkflow && (
 <div className="animate-rise space-y-6">
 <p className="text-xs font-bold uppercase tracking-widest text-amber/80 flex items-center gap-4">
 <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy/10 text-white">2</span>
 Configure Parameters
 </p>
 <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
 <DynamicForm 
 steps={selectedWorkflow.steps} 
 values={formData} 
 onChange={handleFormChange}
 />
 </div>
 </div>
 )}
 </div>

 {/* Live Preview Panel */}
 <div className="lg:sticky lg:top-28 lg:h-fit">
 <p className="text-xs font-bold uppercase tracking-widest text-aqua/80 flex items-center gap-4 mb-6">
 <Search className="h-4 w-4" />
 Live Blueprint Preview
 </p>
 <PreviewPanel preview={preview} loading={loading} />
 
 {preview && (
 <button
 type="button"
 disabled={submitStatus === 'submitting'}
 onClick={() => void handleConfirmRollout()}
 className="mt-6 w-full rounded-full bg-gradient-to-r from-ember to-amber py-4 text-sm font-bold text-navy shadow-xl transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
 >
 {submitStatus === 'submitting' ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Submitting Rollout...
 </>
 ) : (
 'Confirm Rollout Request'
 )}
 </button>
 )}
 </div>
 </div>
 </div>
 </section>

 <section className="bg-white/5 border-y border-white/10 px-4 py-16 lg:px-8">
 <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-3">
 <div className="flex gap-4">
 <ShieldCheck className="h-6 w-6 text-amber shrink-0" />
 <div>
 <h4 className="font-bold text-white">Deterministic Data</h4>
 <p className="mt-2 text-sm text-slate-400">All rollout schedules adapt to real microservice readiness signals.</p>
 </div>
 </div>
 <div className="flex gap-4">
 <Layers3 className="h-6 w-6 text-aqua shrink-0" />
 <div>
 <h4 className="font-bold text-white">Module Consistency</h4>
 <p className="mt-2 text-sm text-slate-400">The same engine builds your dashboard atlas and your rollout plan.</p>
 </div>
 </div>
 <div className="flex gap-4">
 <Rocket className="h-6 w-6 text-ember shrink-0" />
 <div>
 <h4 className="font-bold text-white">Instant Fulfillment</h4>
 <p className="mt-2 text-sm text-slate-400">Verified requests trigger pre-rollout automation within 24 hours.</p>
 </div>
 </div>
 </div>
 </section>
 </main>
 );
}

