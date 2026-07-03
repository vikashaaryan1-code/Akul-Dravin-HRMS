'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
 error,
 reset,
}: {
 error: Error & { digest?: string };
 reset: () => void;
}) {
 useEffect(() => {
 // Log to monitoring service in production
 console.error('[AKUL DRAVIN] Unhandled error:', error);
 }, [error]);

 return (
 <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#02060f] px-6 text-center">
 {/* Background orbs */}
 <div className="pointer-events-none absolute inset-0 overflow-hidden">
 <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-ember/10 blur-[120px]" />
 <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-aqua/8 blur-[120px]" />
 </div>

 <div className="relative z-10 flex max-w-md flex-col items-center gap-6">
 {/* Error icon */}
 <div className="flex h-20 w-20 items-center justify-center rounded-full border border-ember/30 bg-ember/10">
 <svg className="h-10 w-10 text-ember" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
 </svg>
 </div>

 <div>
 <h1 className="text-3xl font-black tracking-tight text-white">Something went wrong</h1>
 <p className="mt-3 text-sm text-slate-500">
 {error.message || 'An unexpected error occurred. Our team has been notified.'}
 </p>
 {error.digest && (
 <p className="mt-2 font-mono text-xs text-slate-600">
 Error ID: {error.digest}
 </p>
 )}
 </div>

 <div className="flex items-center gap-3">
 <button
 onClick={reset}
 className="rounded-2xl bg-gradient-to-r from-aqua to-aqua/80 px-6 py-3 text-sm font-bold text-navy transition-all hover:shadow-lg hover:shadow-aqua/25 active:scale-95"
 >
 Try again
 </button>
 <Link
 href="/dashboard"
 className="rounded-2xl border border-slate-200 bg-slate-50/50 px-6 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-white"
 >
 Go to Dashboard
 </Link>
 </div>
 </div>
 </main>
 );
}
