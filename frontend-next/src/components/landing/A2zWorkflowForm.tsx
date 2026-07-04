'use client';

import { useState, useTransition } from 'react';
import { getPublicApiBaseUrl } from '@/lib/api-base';

type A2zWorkflowFormProps = {
 options: {
 serviceBundles: string[];
 deploymentModels: string[];
 priorities: string[];
 timelines: string[];
 };
};

type SubmissionState = {
 type: 'success' | 'error';
 text: string;
 referenceId?: string;
 workflowPlan?: Array<{
 phase: string;
 status: string;
 owner: string;
 eta: string;
 }>;
} | null;

const INPUT_STYLES =
 'w-full rounded-2xl border border-white/10 bg-navy-light/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber/60 focus:bg-navy-light/60';

const TEXTAREA_STYLES = `${INPUT_STYLES} min-h-[120px] resize-y`;

export function A2zWorkflowForm({ options }: A2zWorkflowFormProps) {
 const [submissionState, setSubmissionState] = useState<SubmissionState>(null);
 const [isPending, startTransition] = useTransition();
 const [form, setForm] = useState({
 fullName: '',
 workEmail: '',
 companyName: '',
 phone: '',
 teamSize: '',
 serviceBundle: options.serviceBundles[0] ?? '',
 deploymentModel: options.deploymentModels[0] ?? '',
 priority: options.priorities[0] ?? '',
 timeline: options.timelines[0] ?? '',
 regions: '',
 workflowGoal: '',
 notes: '',
 });

 const apiBaseUrl = getPublicApiBaseUrl();

 const submit = (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setSubmissionState(null);

 startTransition(async () => {
 try {
 const response = await fetch(`${apiBaseUrl}/public-site/a2z/requests`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 ...form,
 teamSize: form.teamSize ? Number(form.teamSize) : undefined,
 }),
 });

 const payload = (await response.json()) as {
 message?: string;
 nextStep?: string;
 referenceId?: string;
 workflowPlan?: Array<{ phase: string; status: string; owner: string; eta: string }>;
 };

 if (!response.ok) {
 throw new Error(payload.message ?? 'Unable to start the A2Z workflow right now.');
 }

 setSubmissionState({
 type: 'success',
 text: payload.nextStep ?? 'A2Z workflow started successfully.',
 referenceId: payload.referenceId,
 workflowPlan: payload.workflowPlan,
 });
 } catch (caught) {
 setSubmissionState({
 type: 'error',
 text: caught instanceof Error ? caught.message : 'Unable to start the A2Z workflow right now.',
 });
 }
 });
 };

 return (
 <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
 <form id="a2z-form" className="grid gap-4 rounded-[2rem] border border-white/10 bg-navy-light/40 p-6 shadow-2xl backdrop-blur-xl md:grid-cols-2" onSubmit={submit}>
 <div className="md:col-span-2">
 <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber/80">A2Z Form</p>
 <h3 className="mt-2 text-2xl font-semibold text-white">Submit your full workflow requirement</h3>
 <p className="mt-3 text-sm leading-7 text-slate-600">
 Share your service bundle, rollout model, priority, and implementation intent. We return a workflow-based next-step plan immediately.
 </p>
 </div>

 <label className="space-y-2 text-sm text-slate-600">
 <span>Full name</span>
 <input className={INPUT_STYLES} value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Work email</span>
 <input className={INPUT_STYLES} type="email" value={form.workEmail} onChange={(event) => setForm((current) => ({ ...current, workEmail: event.target.value }))} required />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Company</span>
 <input className={INPUT_STYLES} value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} required />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Phone</span>
 <input className={INPUT_STYLES} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Team size</span>
 <input className={INPUT_STYLES} inputMode="numeric" value={form.teamSize} onChange={(event) => setForm((current) => ({ ...current, teamSize: event.target.value }))} />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Regions / locations</span>
 <input className={INPUT_STYLES} value={form.regions} onChange={(event) => setForm((current) => ({ ...current, regions: event.target.value }))} placeholder="India, UAE, UK" />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Service bundle</span>
 <select className={INPUT_STYLES} value={form.serviceBundle} onChange={(event) => setForm((current) => ({ ...current, serviceBundle: event.target.value }))}>
 {options.serviceBundles.map((item) => (
 <option key={item} className="bg-navy-light text-white">
 {item}
 </option>
 ))}
 </select>
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Deployment model</span>
 <select className={INPUT_STYLES} value={form.deploymentModel} onChange={(event) => setForm((current) => ({ ...current, deploymentModel: event.target.value }))}>
 {options.deploymentModels.map((item) => (
 <option key={item} className="bg-navy-light text-white">
 {item}
 </option>
 ))}
 </select>
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Priority</span>
 <select className={INPUT_STYLES} value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
 {options.priorities.map((item) => (
 <option key={item} className="bg-navy-light text-white">
 {item}
 </option>
 ))}
 </select>
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Timeline</span>
 <select className={INPUT_STYLES} value={form.timeline} onChange={(event) => setForm((current) => ({ ...current, timeline: event.target.value }))}>
 {options.timelines.map((item) => (
 <option key={item} className="bg-navy-light text-white">
 {item}
 </option>
 ))}
 </select>
 </label>
 <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
 <span>Workflow goal</span>
 <input className={INPUT_STYLES} value={form.workflowGoal} onChange={(event) => setForm((current) => ({ ...current, workflowGoal: event.target.value }))} placeholder="Example: HRMS + CRM launch with approval automation and analytics" />
 </label>
 <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
 <span>Notes</span>
 <textarea className={TEXTAREA_STYLES} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Tell us what should be combined, replaced, or automated." />
 </label>

 <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <button
 type="submit"
 disabled={isPending}
 className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-ember to-amber px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {isPending ? 'Starting workflow...' : 'Start A2Z workflow'}
 </button>

 {submissionState ? (
 <p className={`text-sm ${submissionState.type === 'success' ? 'text-emerald-200' : 'text-rose-200'}`}>
 {submissionState.text}
 </p>
 ) : null}
 </div>
 </form>

 <div className="space-y-5">
 <div className="rounded-[2rem] border border-navy/10 bg-navy-light/40 p-6 shadow-2xl">
 <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">Workflow Outcome</p>
 <h3 className="mt-2 text-2xl font-semibold text-white">Your next steps appear here</h3>
 <p className="mt-3 text-sm leading-7 text-slate-600">
 Once submitted, this panel shows the A2Z workflow reference and the planned implementation sequence.
 </p>
 </div>

 {submissionState?.type === 'success' && submissionState.workflowPlan ? (
 <div className="space-y-4 rounded-[2rem] border border-white/10 bg-navy-light/40 p-6 backdrop-blur-xl">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber/80">Reference</p>
 <p className="mt-2 text-lg font-semibold text-white">{submissionState.referenceId}</p>
 </div>

 <div className="space-y-3">
 {submissionState.workflowPlan.map((step) => (
 <article key={step.phase} className="rounded-2xl border border-white/10 bg-navy-light/20 p-4">
 <div className="flex items-center justify-between gap-4">
 <h4 className="text-sm font-semibold text-white">{step.phase}</h4>
 <span className="rounded-full border border-navy/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-600">
 {step.status}
 </span>
 </div>
 <p className="mt-2 text-sm text-slate-600">Owner: {step.owner}</p>
 <p className="mt-1 text-sm text-slate-500">ETA: {step.eta}</p>
 </article>
 ))}
 </div>
 </div>
 ) : null}
 </div>
 </div>
 );
}
