import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 — Page Not Found | Akul Dravin HRMS AI',
  description: 'The page you are looking for does not exist. Return to the Akul Dravin enterprise platform.',
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <main
      role="main"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 bg-[#0A1E3A] overflow-hidden"
    >
      {/* Background ambient orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#00E5AB]/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFD700]/5 blur-[100px]" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #94A3B8 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 flex max-w-lg flex-col items-center gap-8 text-center animate-rise">
        {/* 404 Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00E5AB]/30 bg-[#00E5AB]/10 px-4 py-2 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-[#00E5AB] animate-pulse" aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00E5AB]">
            404 — Not Found
          </span>
        </div>

        {/* Giant 404 text */}
        <div aria-hidden="true" className="select-none">
          <p className="text-[8rem] font-black leading-none tracking-tighter text-white/5 sm:text-[12rem]">
            404
          </p>
        </div>

        {/* Main content — overlapping the 404 */}
        <div className="-mt-20 space-y-4">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            This page doesn&apos;t exist
          </h1>
          <p className="mx-auto max-w-sm text-base text-slate-400 leading-relaxed">
            The route you&apos;re looking for has moved, been renamed, or never existed.
            Let&apos;s get you back to the platform.
          </p>
        </div>

        {/* Action buttons */}
        <nav aria-label="Recovery navigation" className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E68E5] to-[#00E5AB] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(30,104,229,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,229,171,0.3)] active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Return Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 active:scale-95"
          >
            Sign In
          </Link>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 backdrop-blur-md transition-all hover:border-white/20 hover:text-white active:scale-95"
          >
            Contact Support
          </Link>
        </nav>

        {/* Quick links */}
        <div className="mt-4 border-t border-white/10 pt-6 w-full">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4">Quick Access</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: '/login', label: 'Dashboard' },
              { href: '/#features', label: 'Features' },
              { href: '/#pricing', label: 'Pricing' },
              { href: '/#contact', label: 'Contact' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-slate-400 transition-all hover:border-[#00E5AB]/30 hover:text-[#00E5AB]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
