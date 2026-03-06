'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Rocket } from 'lucide-react';
import type { PlatformRole } from '@/types/platform';
import { PLATFORM_ROLE_OPTIONS } from '@/utils/platform-config';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PlatformRole>('company-admin');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      router.push(`/login?email=${encodeURIComponent(email)}&role=${role}`);
    }, 800);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(232,90,42,0.14),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(15,139,141,0.16),_transparent_45%)] px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/88 p-8 shadow-panel backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/85"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-ember/30 bg-amber/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ember">
          <Rocket size={13} />
          Start Free Trial
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink dark:text-slate-100">Create Workspace</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Register your organization and continue to secure login.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">First Name</label>
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Last Name</label>
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-950" />
          </div>
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Work Email</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-950"
          placeholder="you@company.com"
          required
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Password</label>
        <input
          type="password"
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-950"
          placeholder="Strong password"
          required
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Primary Role</label>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as PlatformRole)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-950"
        >
          {PLATFORM_ROLE_OPTIONS.map((option) => (
            <option key={option.role} value={option.role}>
              {option.label}
            </option>
          ))}
        </select>

        <button className="mt-6 w-full rounded-full bg-gradient-to-r from-ember to-amber px-5 py-2.5 text-sm font-semibold text-white">
          {submitted ? 'Setting up...' : 'Create Account'}
        </button>

        {submitted ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-aqua/10 px-3 py-2 text-xs text-aqua">
            <CheckCircle2 size={14} />
            Trial request captured. Redirecting to secure sign-in...
          </p>
        ) : null}

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
          Already have an account? <Link className="font-semibold text-aqua" href="/login">Login</Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">
          <Link href="/" className="underline underline-offset-2">Back to website</Link>
        </p>
      </form>
    </main>
  );
}
