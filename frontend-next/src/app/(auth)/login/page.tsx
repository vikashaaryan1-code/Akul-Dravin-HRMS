'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { PlatformRole } from '@/types/platform';
import { platformApi } from '@/services/api/platform-api';
import { useAuthStore } from '@/store/auth-store';
import { PLATFORM_ROLE_OPTIONS, toRoleLabel } from '@/utils/platform-config';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);

  const [email, setEmail] = useState('admin@akuldravin.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<PlatformRole>('platform-admin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    const urlRole = params.get('role');

    if (urlEmail) {
      setEmail(urlEmail);
    }

    if (urlRole && PLATFORM_ROLE_OPTIONS.some((item) => item.role === urlRole)) {
      setSelectedRole(urlRole as PlatformRole);
    }
  }, []);

  const roleHelper = useMemo(() => `Selected workspace: ${toRoleLabel(selectedRole)}`, [selectedRole]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await platformApi.login({ email, password });
      setSession(response);
      setActiveRole(selectedRole);
      router.push(`/dashboard?role=${selectedRole}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to login.';
      setError(`${message} You can continue in demo mode.`);
    } finally {
      setSubmitting(false);
    }
  };

  const continueDemo = () => {
    setSession({
      accessToken: 'demo-token',
      user: {
        id: 'demo-user',
        email,
        fullName: 'Demo User',
        tenantId: null,
        role: selectedRole,
      },
    });
    setActiveRole(selectedRole);
    router.push(`/dashboard?role=${selectedRole}`);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(232,90,42,0.14),_transparent_40%)] px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-white/60 bg-white/85 p-8 shadow-panel backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/85"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-aqua/30 bg-aqua/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-aqua">
          <ShieldCheck size={13} />
          Enterprise Access
        </div>
        <h1 className="mt-3 text-3xl font-bold text-ink dark:text-slate-100">Sign In</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Connect to AKUL DRAVIN backend APIs and open your role workspace.</p>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Work Email</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-950"
          placeholder="admin@company.com"
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-950"
          placeholder="••••••••"
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Open Workspace As</label>
        <select
          value={selectedRole}
          onChange={(event) => setSelectedRole(event.target.value as PlatformRole)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-950"
        >
          {PLATFORM_ROLE_OPTIONS.map((option) => (
            <option key={option.role} value={option.role}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">{roleHelper}</p>

        {error ? <p className="mt-4 rounded-xl bg-amber/15 px-3 py-2 text-xs text-ember">{error}</p> : null}

        <button
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-ink to-aqua px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Login'}
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={continueDemo}
          className="mt-3 w-full rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Continue Demo
        </button>

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
          New user? <Link className="font-semibold text-aqua" href="/signup">Start free trial</Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">
          <Link href="/" className="underline underline-offset-2">Back to website</Link>
        </p>
      </form>
    </main>
  );
}
