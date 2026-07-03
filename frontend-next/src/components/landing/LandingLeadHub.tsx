'use client';

import { useState, useTransition } from 'react';
import { getPublicApiBaseUrl } from '@/lib/api-base';

type StatusState = {
 type: 'success' | 'error';
 text: string;
} | null;

const INPUT_STYLES =
 'w-full rounded-2xl border border-navy/10 bg-navy/5 px-4 py-3 text-sm text-navy outline-none transition placeholder:text-slate-500 focus:border-amber/60 focus:bg-navy/10';

const TEXTAREA_STYLES = `${INPUT_STYLES} min-h-[120px] resize-y`;

export function LandingLeadHub() {
 const [inquiryStatus, setInquiryStatus] = useState<StatusState>(null);
 const [newsletterStatus, setNewsletterStatus] = useState<StatusState>(null);
 const [inquiryLoading, setInquiryLoading] = useState(false);
 const [newsletterLoading, setNewsletterLoading] = useState(false);
 const [inquiryForm, setInquiryForm] = useState({
 fullName: '',
 workEmail: '',
 companyName: '',
 phone: '',
 teamSize: '',
 interestArea: 'Full platform rollout',
 message: '',
 });
 const [newsletterEmail, setNewsletterEmail] = useState('');

 const apiBaseUrl = getPublicApiBaseUrl();

 const submitInquiry = async (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setInquiryStatus(null);

 setInquiryLoading(true);
 try {
 const response = await fetch(`${apiBaseUrl}/public-site/inquiries`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 ...inquiryForm,
 teamSize: inquiryForm.teamSize ? Number(inquiryForm.teamSize) : undefined,
 }),
 });

 const payload = (await response.json()) as { nextStep?: string; message?: string };

 if (!response.ok) {
 const errorText =
 typeof payload.message === 'string'
 ? payload.message
 : 'We could not submit your request. Please try again.';
 throw new Error(errorText);
 }

 setInquiryStatus({
 type: 'success',
 text: payload.nextStep ?? 'Request submitted successfully. Our team will contact you shortly.',
 });
 setInquiryForm({
 fullName: '',
 workEmail: '',
 companyName: '',
 phone: '',
 teamSize: '',
 interestArea: 'Full platform rollout',
 message: '',
 });
 } catch (caught) {
 setInquiryStatus({
 type: 'error',
 text: caught instanceof Error ? caught.message : 'Unable to submit your request right now.',
 });
 } finally {
 setInquiryLoading(false);
 }
 };

 const submitNewsletter = async (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setNewsletterStatus(null);

 setNewsletterLoading(true);
 try {
 const response = await fetch(`${apiBaseUrl}/public-site/newsletter`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email: newsletterEmail, source: 'premium-landing' }),
 });

 const payload = (await response.json()) as { message?: string };

 if (!response.ok) {
 throw new Error(payload.message ?? 'Unable to subscribe right now.');
 }

 setNewsletterStatus({
 type: 'success',
 text: 'Subscribed successfully. You will receive release notes and rollout updates.',
 });
 setNewsletterEmail('');
 } catch (caught) {
 setNewsletterStatus({
 type: 'error',
 text: caught instanceof Error ? caught.message : 'Unable to subscribe right now.',
 });
 } finally {
 setNewsletterLoading(false);
 }
 };

 return (
 <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
 <div className="rounded-[2rem] border border-navy/10 bg-navy/5 p-6 shadow-2xl backdrop-blur-xl">
 <div className="mb-6 flex items-center justify-between gap-4">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber/80">Launch Consultation</p>
 <h3 className="mt-2 text-2xl font-semibold text-navy">Request an A2Z platform walkthrough</h3>
 </div>
 <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
 Response within 1 business day
 </div>
 </div>

 <form className="grid gap-4 md:grid-cols-2" onSubmit={submitInquiry}>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Full name</span>
 <input
 className={INPUT_STYLES}
 value={inquiryForm.fullName}
 onChange={(event) => setInquiryForm((current) => ({ ...current, fullName: event.target.value }))}
 placeholder="Aarav Menon"
 name="fullName"
 required
 />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Work email</span>
 <input
 className={INPUT_STYLES}
 value={inquiryForm.workEmail}
 onChange={(event) => setInquiryForm((current) => ({ ...current, workEmail: event.target.value }))}
 placeholder="aarav@company.com"
 type="email"
 name="workEmail"
 required
 />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Company</span>
 <input
 className={INPUT_STYLES}
 value={inquiryForm.companyName}
 onChange={(event) => setInquiryForm((current) => ({ ...current, companyName: event.target.value }))}
 placeholder="NorthGrid Energy"
 name="companyName"
 required
 />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Team size</span>
 <input
 className={INPUT_STYLES}
 value={inquiryForm.teamSize}
 onChange={(event) => setInquiryForm((current) => ({ ...current, teamSize: event.target.value }))}
 placeholder="450"
 inputMode="numeric"
 name="teamSize"
 />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Phone</span>
 <input
 className={INPUT_STYLES}
 value={inquiryForm.phone}
 onChange={(event) => setInquiryForm((current) => ({ ...current, phone: event.target.value }))}
 placeholder="+91 90000 00000"
 name="phone"
 />
 </label>
 <label className="space-y-2 text-sm text-slate-600">
 <span>Interest area</span>
 <select
 className={INPUT_STYLES}
 value={inquiryForm.interestArea}
 onChange={(event) => setInquiryForm((current) => ({ ...current, interestArea: event.target.value }))}
 name="interestArea"
 >
 <option className="bg-white text-navy">Full platform rollout</option>
 <option className="bg-white text-navy">HRMS transformation</option>
 <option className="bg-white text-navy">CRM + sales operations</option>
 <option className="bg-white text-navy">Finance + billing stack</option>
 <option className="bg-white text-navy">White-label / enterprise deployment</option>
 </select>
 </label>
 <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
 <span>Project brief</span>
 <textarea
 className={TEXTAREA_STYLES}
 value={inquiryForm.message}
 onChange={(event) => setInquiryForm((current) => ({ ...current, message: event.target.value }))}
 placeholder="Tell us which modules, geographies, or rollout goals you want to combine."
 name="message"
 />
 </label>

 <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <button
 type="submit"
 disabled={inquiryLoading}
 className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-ember to-amber px-6 py-3 text-sm font-semibold text-navy transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {inquiryLoading ? 'Submitting...' : 'Request live walkthrough'}
 </button>
 {inquiryStatus ? (
 <p className={`text-sm ${inquiryStatus.type === 'success' ? 'text-emerald-200' : 'text-rose-200'}`}>
 {inquiryStatus.text}
 </p>
 ) : null}
 </div>
 </form>
 </div>

 <div className="space-y-6">
 <div className="rounded-[2rem] border border-navy/10 bg-slate-50/70 p-6 shadow-2xl">
 <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">Launch Notes</p>
 <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
 <li>Dedicated setup guidance for HRMS, finance, CRM, and operational modules.</li>
 <li>Role-based dashboards for admins, managers, recruiters, and employees.</li>
 <li>Roadmap planning for phased rollout, migration, and enterprise controls.</li>
 </ul>
 </div>

 <div className="rounded-[2rem] border border-navy/10 bg-navy/5 p-6 shadow-2xl backdrop-blur-xl">
 <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber/80">Product Updates</p>
 <h3 className="mt-2 text-xl font-semibold text-navy">Subscribe to release and rollout updates</h3>
 <p className="mt-3 text-sm leading-6 text-slate-600">
 Get product notes, automation templates, deployment insights, and launch guidance in your inbox.
 </p>

 <form className="mt-5 space-y-4" onSubmit={submitNewsletter}>
 <input
 className={INPUT_STYLES}
 value={newsletterEmail}
 onChange={(event) => setNewsletterEmail(event.target.value)}
 type="email"
 placeholder="name@company.com"
 required
 />
 <button
 type="submit"
 disabled={newsletterLoading}
 className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-navy/10 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {newsletterLoading ? 'Subscribing...' : 'Subscribe now'}
 </button>
 {newsletterStatus ? (
 <p className={`text-sm ${newsletterStatus.type === 'success' ? 'text-emerald-200' : 'text-rose-200'}`}>
 {newsletterStatus.text}
 </p>
 ) : null}
 </form>
 </div>
 </div>
 </div>
 );
}
