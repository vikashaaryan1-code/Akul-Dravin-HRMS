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
    // TODO: Replace with proper monitoring (Sentry, OpenTelemetry, Datadog)
    console.error('[AKUL DRAVIN] Unhandled error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <main
      role="main"
      aria-labelledby="error-heading"
      className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0A1E3A] px-6 text-center overflow-hidden"
    >
      {/* Background ambient orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#E85A2A]/10 blur-[130px]" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-[#00E5AB]/6 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #94A3B8 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center gap-6">
        {/* Error icon */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#E85A2A]/30 bg-[#E85A2A]/10 backdrop-blur-md"
          aria-hidden="true"
        >
          <svg
            className="h-10 w-10 text-[#E85A2A]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Error status badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E85A2A]/30 bg-[#E85A2A]/10 px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E85A2A] animate-pulse" aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E85A2A]">
            500 — System Error
          </span>
        </div>

        <div className="space-y-3">
          <h1
            id="error-heading"
            className="text-3xl font-black tracking-tight text-white sm:text-4xl"
          >
            Something went wrong
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            {error.message && error.message.length < 120
              ? error.message
              : 'An unexpected error occurred. Our engineering team has been automatically notified.'}
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-slate-600 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-block">
              Error ID: <span className="text-slate-400 select-all">{error.digest}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E68E5] to-[#00E5AB] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(30,104,229,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,229,171,0.3)] active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 active:scale-95"
          >
            Return Home
          </Link>
          <Link
            href="mailto:support@akuldravin.com"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 backdrop-blur-md transition-all hover:text-white active:scale-95"
          >
            Contact Support
          </Link>
        </div>

        {/* Help text */}
        <p className="text-xs text-slate-600 max-w-xs">
          If this issue persists, please include the Error ID when contacting support.
        </p>
      </div>
    </main>
  );
}
