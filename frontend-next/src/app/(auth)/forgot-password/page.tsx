'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api('/auth/forgot-password', {
        method: 'POST',
        body:   JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      // Always show success (API prevents email enumeration)
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? 'Something went wrong. Please try again.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background */}
      <div className="absolute -left-1/4 -top-1/4 h-[700px] w-[700px] rounded-full bg-blue-600/8 blur-[130px]" />
      <div className="absolute -bottom-1/4 right-0 h-[600px] w-[600px] rounded-full bg-violet-600/6 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl sm:p-10">

          {success ? (
            /* ── Success State ─────────────────────────────────────────── */
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Check Your Inbox</h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  If <span className="font-semibold text-white">{email}</span> is registered,
                  you&apos;ll receive a password reset link within a few minutes.
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  The link expires in <span className="text-amber-400 font-semibold">15 minutes</span>.
                  Check your spam folder if you don&apos;t see it.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            /* ── Form State ──────────────────────────────────────────────── */
            <>
              {/* Brand */}
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 p-0.5">
                  <ShieldCheck className="h-7 w-7 text-blue-400" />
                </div>
                <h1 className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                  Reset Password
                </h1>
                <p className="mt-2.5 text-sm text-slate-400">
                  Enter your email and we&apos;ll send you a secure reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="forgot-email"
                    className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@akuldravin.com"
                      className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-400/10"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  id="forgot-submit"
                  disabled={loading || !email}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 text-sm font-black text-white shadow-xl shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-[10px] font-medium leading-relaxed text-slate-700">
          This system is protected by enterprise-grade encryption.<br />
          Reset links expire after 15 minutes for your security.
        </p>
      </div>
    </main>
  );
}
