'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
 ShieldCheck,
 Mail,
 Lock,
 AlertCircle,
 Eye,
 EyeOff,
 LayoutDashboard,
 KeyRound,
 RotateCcw,
 ShieldAlert,
 Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

/* ── Google Icon ────────────────────────────────────────────────────────────── */ function GoogleIcon() {
 return (
 <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
 </svg>
 );
}

/* ── Types ──────────────────────────────────────────────────────────────────── */ interface LoginResponse {
 accessToken: string;
 user: {
 id: string;
 tenantId: string;
 email: string;
 fullName: string;
 roleId?: string;
 avatarUrl?: string;
 oauthProvider?: string;
 };
 mfaRequired: boolean;
 mfaSetupPending: boolean;
}

/* ── Constants ───────────────────────────────────────────────────────────────── */ const MFA_MAX_ATTEMPTS = 3;
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1';
const GOOGLE_AUTH_URL = `${BACKEND_URL}/auth/google`;

/* ───────────────────────────────────────────────────────────────────────────── */ function LoginContent() {
 const router = useRouter();
 const searchParams = useSearchParams();

 /* Stage 1: credential fields */ const [formData, setFormData] = useState({ email: '', password: '' });
 const [showPassword, setShowPassword] = useState(false);

 /* Stage 2: MFA */ const [mfaStep, setMfaStep] = useState(false);
 const [mfaCode, setMfaCode] = useState('');
 const [mfaAttempts, setMfaAttempts] = useState(0);
 const [tempToken, setTempToken] = useState<string | null>(null);

 /* Setup nudge */ const [mfaSetupNudge, setMfaSetupNudge] = useState(false);
 const [nudgeDismissed, setNudgeDismissed] = useState(false);

 /* Shared state */ const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Pre-fill email from query param
 useEffect(() => {
 const emailParam = searchParams?.get('email');
 if (emailParam) setFormData((prev) => ({ ...prev, email: emailParam }));

 const errorParam = searchParams?.get('error');
 if (errorParam) setError(decodeURIComponent(errorParam));

 const reason = searchParams?.get('reason');
 if (reason === 'session_expired') setError('Your session has expired. Please sign in again.');
 }, [searchParams]);

 /* ── Stage 1: password login ─────────────────────────────────────────────── */ const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setLoading(true);
 setError(null);

 try {
 const response = await api('/auth/login', {
 method: 'POST',
 body: JSON.stringify(formData),
 });

 if (!response.ok) {
 let message = 'Invalid credentials';
 try {
 const errorData = await response.json() as { message?: string };
 message = errorData?.message || message;
 } catch { /* non-JSON body */ }
 throw new Error(message);
 }

 const data: LoginResponse = await response.json();

 if (data.mfaRequired) {
 setTempToken(data.accessToken);
 setMfaStep(true);
 setMfaCode('');
 setMfaAttempts(0);
 return;
 }

 finalizeLogin(data);
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Something went wrong');
 } finally {
 setLoading(false);
 }
 };

 /* ── Google OAuth ────────────────────────────────────────────────────────── */ const handleGoogleLogin = () => {
 /* Store ?next= destination so OAuth callback can redirect there */ const next = searchParams?.get('next');
 if (next) sessionStorage.setItem('auth-next', next);
 window.location.href = GOOGLE_AUTH_URL;
 };

 /* ── Stage 2: TOTP verification ─────────────────────────────────────────── */ const handleMfaVerify = async (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 if (!tempToken) return;

 setLoading(true);
 setError(null);

 try {
 const response = await api('/auth/mfa/verify', {
 method: 'POST',
 headers: { Authorization: `Bearer ${tempToken}` },
 body: JSON.stringify({ code: mfaCode }),
 });

 if (!response.ok) {
 let message = 'Invalid authentication code';
 try {
 const errorData = await response.json() as { message?: string };
 message = errorData?.message || message;
 } catch { /* non-JSON */ }

 const nextAttempts = mfaAttempts + 1;
 setMfaAttempts(nextAttempts);

 if (nextAttempts >= MFA_MAX_ATTEMPTS) {
 setMfaStep(false);
 setTempToken(null);
 setMfaCode('');
 setMfaAttempts(0);
 throw new Error('Maximum authentication attempts reached. Please sign in again.');
 }

 const remaining = MFA_MAX_ATTEMPTS - nextAttempts;
 throw new Error(`${message} — ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`);
 }

 finalizeLoginWithToken(tempToken, formData.email);
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Verification failed');
 } finally {
 setLoading(false);
 }
 };

 /* ── Shared finalization ─────────────────────────────────────────────────── */ const finalizeLogin = (data: LoginResponse) => {
 useAuthStore.getState().setAuth({
 user: data.user,
 token: data.accessToken,
 });

 // Sync auth cookie for Next.js middleware
 setAuthCookie(data.accessToken);

 if (data.mfaSetupPending) setMfaSetupNudge(true);

 const next = searchParams?.get('next') || '/dashboard';
 router.replace(next);
 };

 const finalizeLoginWithToken = (token: string, email: string) => {
 useAuthStore.getState().setAuth({
 user: { email } as any,
 token,
 });
 setAuthCookie(token);
 router.replace('/dashboard');
 };

 /* Set auth cookie for middleware */ const setAuthCookie = (token: string) => {
 try {
 const parts = token.split('.');
 const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
 const maxAge = payload.exp ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : 3600;
 document.cookie = `akul-auth-token=${token}; max-age=${maxAge}; path=/; SameSite=Strict`;
 } catch { /* ignore */ }
 };

 /* ── Input handlers ──────────────────────────────────────────────────────── */ const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const resetToLogin = () => {
 setMfaStep(false);
 setTempToken(null);
 setMfaCode('');
 setMfaAttempts(0);
 setError(null);
 };

 /* ── Render ──────────────────────────────────────────────────────────────── */ return (
 <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
 {/* Background Ambience */}
 <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-blue-600/8 blur-[130px]" />
 <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-violet-600/6 blur-[130px]" />

 <div className="relative w-full max-w-md">
 {/* Main Card */}
 <div className="group overflow-hidden rounded-[38px] glass-3d-panel p-8 transition-all duration-500 hover:border-white/20 sm:p-10">

 {/* Brand */}
 <div className="mb-8 flex flex-col items-center text-center">
 <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 p-0.5 shadow-xl transition-all duration-700 group-hover:scale-110 group-hover:bg-white/10 ${mfaStep ? 'bg-amber-500/10' : ''}`}>
 {mfaStep
 ? <KeyRound className="h-7 w-7 text-amber-400" />
 : <ShieldCheck className="h-7 w-7 text-blue-400" />
 }
 </div>
 <h1 className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-4xl font-black tracking-tight text-transparent">
 {mfaStep ? 'Verify Identity' : 'Welcome Back'}
 </h1>
 <p className="mt-2.5 text-sm text-slate-500">
 {mfaStep
 ? 'Enter the 6-digit code from your authenticator app'
 : 'Secure access to Akul Dravin HRMS'
 }
 </p>
 </div>

 {/* ── STAGE 1: Credentials ──────────────────────────────────────── */}
 {!mfaStep && (
 <>
 {/* Google OAuth Button */}
 <button
 type="button"
 id="google-login"
 onClick={handleGoogleLogin}
 className="group/g mb-5 flex w-full items-center justify-center gap-3 rounded-2xl glass-3d-panel py-3.5 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10 active:scale-95"
 >
 <GoogleIcon />
 Continue with Google
 </button>

 {/* Divider */}
 <div className="mb-5 flex items-center gap-3">
 <div className="flex-1 border-t border-white/5" />
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
 or sign in with email
 </span>
 <div className="flex-1 border-t border-white/5" />
 </div>

 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="space-y-1.5">
 <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
 Security Identity
 </label>
 <div className="relative">
 <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
 <input
 type="email"
 name="email"
 id="login-email"
 required
 value={formData.email}
 onChange={handleChange}
 placeholder="admin@akuldravin.com"
 className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-400/10"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <div className="flex items-center justify-between px-1">
 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
 Access Token
 </label>
 <Link
 href="/forgot-password"
 className="text-[10px] font-bold text-blue-400 transition-colors hover:text-white"
 >
 FORGOT?
 </Link>
 </div>
 <div className="relative">
 <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
 <input
 type={showPassword ? 'text' : 'password'}
 name="password"
 id="login-password"
 required
 value={formData.password}
 onChange={handleChange}
 placeholder="••••••••"
 className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-11 text-sm text-white outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-400/10"
 />
 <button
 type="button"
 id="toggle-password"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
 >
 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
 </button>
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
 id="login-submit"
 disabled={loading}
 className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 text-sm font-black text-white shadow-xl shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
 >
 {loading ? (
 <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
 ) : (
 'Sign In'
 )}
 </button>
 </form>

 {/* Alternative Actions */}
 <div className="mt-6 grid grid-cols-2 gap-3">
 <button
 type="button"
 id="system-status"
 className="flex items-center justify-center gap-2 rounded-xl glass-3d-panel py-2.5 text-[11px] font-bold text-slate-500 transition-all hover:border-white/10 hover:bg-white/10"
 >
 <LayoutDashboard size={14} />
 SYSTEM STATUS
 </button>
 <Link
 href="/signup"
 className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/5 py-2.5 text-[11px] font-bold text-blue-400 transition-all hover:bg-blue-400/10"
 >
 CREATE CORE ID
 </Link>
 </div>
 </>
 )}

 {/* ── STAGE 2: MFA ─────────────────────────────────────────────── */}
 {mfaStep && (
 <form onSubmit={handleMfaVerify} className="space-y-5">
 {/* Attempt indicator dots */}
 <div className="flex justify-center gap-2">
 {Array.from({ length: MFA_MAX_ATTEMPTS }).map((_, i) => (
 <div
 key={i}
 className={`h-2 w-2 rounded-full transition-colors ${
 i < mfaAttempts ? 'bg-red-500' : 'bg-white/20'
 }`}
 />
 ))}
 </div>

 <div className="space-y-1.5">
 <label
 htmlFor="mfa-code"
 className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"
 >
 Authenticator Code
 </label>
 <div className="relative">
 <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
 <input
 id="mfa-code"
 type="text"
 inputMode="numeric"
 pattern="[0-9]{6}"
 maxLength={6}
 required
 autoFocus
 value={mfaCode}
 onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
 placeholder="000000"
 className="w-full rounded-2xl border border-amber-400/20 bg-amber-400/5 py-3.5 pl-11 pr-4 text-center text-2xl font-mono tracking-[0.5em] text-white outline-none transition-all focus:border-amber-400/50 focus:bg-amber-400/10 focus:ring-4 focus:ring-amber-400/10"
 />
 </div>
 <p className="ml-1 text-[10px] text-slate-600">
 Open Google Authenticator / Authy and enter the 6-digit code
 </p>
 </div>

 {error && (
 <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
 <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
 {error}
 </div>
 )}

 <button
 type="submit"
 id="mfa-submit"
 disabled={loading || mfaCode.length !== 6}
 className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-amber-400 py-4 text-sm font-black text-slate-950 shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
 >
 {loading ? 'Verifying…' : 'Verify Code'}
 </button>

 <button
 type="button"
 id="mfa-back"
 onClick={resetToLogin}
 className="flex w-full items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:text-white"
 >
 <RotateCcw className="h-3 w-3" />
 Back to login
 </button>
 </form>
 )}

 {/* ── MFA Setup Nudge ─────────────────────────────────────────── */}
 {mfaSetupNudge && !nudgeDismissed && (
 <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
 <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
 <div className="flex-1 text-xs text-amber-300">
 <p className="font-bold">Secure your account</p>
 <p className="mt-0.5 text-amber-400/80">
 Enable two-factor authentication for extra protection.
 </p>
 </div>
 <button
 type="button"
 id="nudge-dismiss"
 onClick={() => setNudgeDismissed(true)}
 className="text-[10px] font-bold text-amber-400/60 hover:text-amber-400"
 >
 Dismiss
 </button>
 </div>
 )}

 {/* Home Link */}
 <div className="mt-8 text-center">
 <Link href="/" className="text-[10px] font-bold tracking-widest text-slate-600 transition-colors hover:text-white">
 RETURN TO HUB
 </Link>
 </div>
 </div>

 {/* System Info Footnote */}
 <p className="mt-10 text-center text-[10px] font-medium leading-relaxed text-slate-700">
 This system is protected by enterprise-grade encryption.<br />
 Unauthorized access attempts are logged and reported.
 </p>
 </div>
 </main>
 );
}

import { Suspense } from 'react';

export default function LoginPage() {
 return (
 <Suspense fallback={
 <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
 <div className="relative flex flex-col items-center gap-6 text-center">
 <div className="flex items-center gap-2 text-xs text-slate-600">
 <Loader2 className="h-3 w-3 animate-spin" />
 <span>Loading...</span>
 </div>
 </div>
 </main>
 }>
 <LoginContent />
 </Suspense>
 );
}
