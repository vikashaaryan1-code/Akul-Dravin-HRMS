'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

/**
 * /oauth-callback
 *
 * Landing page after Google OAuth redirect.
 * The backend redirects here with:
 * ?access_token=<jwt>&refresh_token=<jwt>
 *
 * This page:
 * 1. Reads the tokens from URL params
 * 2. Decodes the access token to get user info
 * 3. Stores tokens in Zustand + sets auth cookie
 * 4. Clears the tokens from the URL (security)
 * 5. Redirects to /dashboard (or ?next= param)
 */

interface JwtPayload {
 sub: string;
 email: string;
 role: string;
 tenantId: string;
 exp: number;
}

function decodeJwt(token: string): JwtPayload | null {
 try {
 const parts = token.split('.');
 if (parts.length !== 3) return null;
 return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
 } catch {
 return null;
 }
}

function setAuthCookie(token: string, payload: JwtPayload) {
 const maxAge = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
 document.cookie = `akul-auth-token=${token}; max-age=${maxAge}; path=/; SameSite=Strict`;
}

function OAuthCallbackContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const setSession = useAuthStore((s) => s.setSession);
 const [error, setError] = useState<string | null>(null);
 const processed = useRef(false);

 useEffect(() => {
 if (processed.current) return;
 processed.current = true;

 const accessToken = searchParams?.get('access_token');
 const refreshToken = searchParams?.get('refresh_token');
 const errorParam = searchParams?.get('error');

 // Clear tokens from URL immediately for security
 window.history.replaceState({}, '', '/oauth-callback');

 if (errorParam) {
 setError(decodeURIComponent(errorParam));
 return;
 }

 if (!accessToken) {
 setError('Authentication failed: no token received from Google.');
 return;
 }

 const payload = decodeJwt(accessToken);
 if (!payload) {
 setError('Authentication failed: invalid token received.');
 return;
 }

 /* Token expired (shouldn't happen but be defensive) */ if (payload.exp * 1000 < Date.now()) {
 setError('Authentication token expired. Please try signing in again.');
 return;
 }

 // Store session in Zustand
 setSession({
 accessToken,
 user: {
 id: payload.sub,
 email: payload.email,
 role: payload.role,
 tenantId: payload.tenantId,
 },
 });

 /* Store refresh token in localStorage for later rotation */ if (refreshToken) {
 try {
 localStorage.setItem('akul-refresh-token', refreshToken);
 } catch { /* private browsing — ignore */ }
 }

 // Sync cookie for Next.js middleware
 setAuthCookie(accessToken, payload);

 // Redirect to dashboard (or ?next= if set before OAuth)
 const next = sessionStorage.getItem('auth-next') || '/dashboard';
 sessionStorage.removeItem('auth-next');

 router.replace(next);
 }, [router, searchParams, setSession]);

 if (error) {
 return (
 <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4">
 <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-red-500/5 blur-[130px]" />

 <div className="relative w-full max-w-md text-center space-y-6">
 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
 <AlertCircle className="h-8 w-8 text-red-400" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-navy">Sign-in Failed</h1>
 <p className="mt-3 text-sm text-slate-500">{error}</p>
 </div>
 <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
 <Link
 href="/login"
 className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
 >
 Back to Login
 </Link>
 </div>
 </div>
 </main>
 );
 }

 return (
 <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4">
 {/* Background */}
 <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-blue-600/8 blur-[130px]" />
 <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-violet-600/8 blur-[130px]" />

 <div className="relative flex flex-col items-center gap-6 text-center">
 {/* Animated logo ring */}
 <div className="relative flex h-20 w-20 items-center justify-center">
 <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
 <div className="absolute inset-2 rounded-full border border-blue-400/30" />
 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600">
 <ShieldCheck className="h-6 w-6 text-white" />
 </div>
 </div>

 <div className="space-y-2">
 <h1 className="text-xl font-bold text-navy">Completing Sign-In</h1>
 <p className="text-sm text-slate-500">Verifying your Google account…</p>
 </div>

 <div className="flex items-center gap-2 text-xs text-slate-600">
 <Loader2 className="h-3 w-3 animate-spin" />
 <span>Securing your session</span>
 </div>
 </div>
 </main>
 );
}

import { Suspense } from 'react';

export default function OAuthCallbackPage() {
 return (
 <Suspense fallback={
 <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4">
 <div className="relative flex flex-col items-center gap-6 text-center">
 <div className="flex items-center gap-2 text-xs text-slate-600">
 <Loader2 className="h-3 w-3 animate-spin" />
 <span>Loading...</span>
 </div>
 </div>
 </main>
 }>
 <OAuthCallbackContent />
 </Suspense>
 );
}
