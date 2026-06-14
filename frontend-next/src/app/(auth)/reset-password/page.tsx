'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Loader2, ShieldCheck, ArrowRight, XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

// ── Password strength helpers ─────────────────────────────────────────────────
const RULES = [
  { label: 'At least 8 characters',  test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',    test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',    test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number',             test: (p: string) => /\d/.test(p) },
];

function strengthScore(password: string): number {
  return RULES.filter((r) => r.test(password)).length;
}

const STRENGTH_CONFIG = [
  { label: 'Weak',    color: 'bg-red-500',    text: 'text-red-400' },
  { label: 'Fair',    color: 'bg-amber-500',   text: 'text-amber-400' },
  { label: 'Good',    color: 'bg-yellow-400',  text: 'text-yellow-400' },
  { label: 'Strong',  color: 'bg-emerald-500', text: 'text-emerald-400' },
  { label: 'Perfect', color: 'bg-blue-500',    text: 'text-blue-400' },
];

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const token = searchParams?.get('token') ?? '';

  const [password,        setPassword]        = useState('');
  const [showPassword,    setShowPassword]     = useState(false);
  const [loading,         setLoading]          = useState(false);
  const [success,         setSuccess]          = useState(false);
  const [error,           setError]            = useState<string | null>(null);
  const [tokenValid,      setTokenValid]       = useState<boolean | null>(null);

  // Validate token presence
  useEffect(() => {
    if (!token || token.length < 32) {
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const score = strengthScore(password);
  const cfg   = STRENGTH_CONFIG[Math.min(score, STRENGTH_CONFIG.length - 1)];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (score < RULES.length) return; // All rules must pass

    setLoading(true);
    setError(null);

    try {
      const res = await api('/auth/reset-password', {
        method: 'POST',
        body:   JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json().catch(() => ({})) as { message?: string };

      if (!res.ok) {
        throw new Error(data.message ?? 'Failed to reset password. The link may have expired.');
      }

      setSuccess(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── Invalid token state ───────────────────────────────────────────────────
  if (tokenValid === false) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-red-500/5 blur-[130px]" />
        <div className="relative w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Invalid Reset Link</h1>
            <p className="mt-3 text-sm text-slate-400">
              This password reset link is invalid or has expired. Reset links are valid for 15 minutes.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
          >
            Request New Link
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
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
                <h1 className="text-2xl font-black text-white">Password Reset!</h1>
                <p className="mt-3 text-sm text-slate-400">
                  Your password has been updated. Redirecting to login…
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Sign In Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            /* ── Form State ──────────────────────────────────────────────── */
            <>
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 p-0.5">
                  <ShieldCheck className="h-7 w-7 text-blue-400" />
                </div>
                <h1 className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                  New Password
                </h1>
                <p className="mt-2.5 text-sm text-slate-400">
                  Choose a strong password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="reset-password"
                    className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-11 text-sm text-white outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-400/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength Bar */}
                  {password.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-1">
                        {STRENGTH_CONFIG.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i < score ? cfg.color : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[11px] font-bold ${cfg.text}`}>{cfg.label}</p>
                    </div>
                  )}
                </div>

                {/* Password Rules */}
                <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-4">
                  {RULES.map((rule) => {
                    const passes = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {passes ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
                        )}
                        <span className={`text-[11px] font-medium ${passes ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  id="reset-submit"
                  disabled={loading || score < RULES.length}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 text-sm font-black text-white shadow-xl shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</>
                  ) : (
                    <>Reset Password <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

import { Suspense } from 'react';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
        <div className="relative flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
