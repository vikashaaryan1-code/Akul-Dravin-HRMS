import Link from 'next/link';
import { NAV_ITEMS } from './landing-data';

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-ember to-amber shadow-panel" />
          <span className="text-sm font-semibold tracking-[0.22em] text-ink sm:text-base">AKUL DRAVIN</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} href={item.href} className="text-sm font-medium text-slate-700 transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-ink"
          >
            Login
          </Link>
          <Link
            href="/subscription"
            className="rounded-full bg-gradient-to-r from-ember to-amber px-5 py-2 text-sm font-semibold text-white shadow-panel transition hover:opacity-90"
          >
            Start Free Trial
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-3 px-4 pb-4 lg:hidden">
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="grid grid-cols-2 gap-2 sm:hidden">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700"
          >
            Login
          </Link>
          <Link
            href="/subscription"
            className="rounded-full bg-gradient-to-r from-ember to-amber px-3 py-2 text-center text-xs font-semibold text-white"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </header>
  );
}
