import Image from 'next/image';
import Link from 'next/link';
import { DASHBOARD_BULLETS, PLATFORM_STATS } from './landing-data';

function DashboardIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-amber/30 blur-3xl" />
      <div className="absolute -right-6 bottom-2 h-24 w-24 rounded-full bg-aqua/30 blur-3xl" />
      <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-3 shadow-panel backdrop-blur">
        <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 sm:h-72">
          <Image
            src="/images/office-portal/landing-command.svg"
            alt="AKUL DRAVIN Office Portal command center illustration"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 520px"
            priority
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-amber/15 to-white p-4">
            <p className="text-xs text-slate-500">Workday Compliance</p>
            <p className="mt-2 text-2xl font-bold text-ink">96.4%</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-[82%] rounded-full bg-gradient-to-r from-ember to-amber" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-aqua/15 to-white p-4">
            <p className="text-xs text-slate-500">Location Integrity</p>
            <p className="mt-2 text-2xl font-bold text-ink">98.1%</p>
            <p className="mt-3 text-xs text-slate-500">Geofence + WFH verified</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">Automation Orchestration</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DASHBOARD_BULLETS.map((item) => (
                <span
                  key={item}
                  className="rounded-xl bg-mist px-2 py-2 text-center text-[10px] font-semibold text-slate-600 sm:text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden px-4 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-7 animate-rise">
          <p className="inline-flex rounded-full border border-ember/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ember">
            Enterprise Office Portal + HRMS
          </p>

          <h1 className="text-balance text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
            AKUL DRAVIN OFFICE PORTAL & HRMS PLATFORM
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Monitor attendance, work activity, role permissions, location, performance, payroll, recruitment, and workflow automation in one intelligent enterprise system.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-ember to-amber px-6 py-3 text-sm font-semibold text-white shadow-panel transition hover:opacity-95"
            >
              Start Free Trial
            </Link>
            <Link
              href="#contact"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
            >
              Book Demo
            </Link>
          </div>

          <div className="grid max-w-xl grid-cols-3 gap-3">
            {PLATFORM_STATS.slice(0, 3).map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/80 bg-white/90 p-3 text-center shadow-panel">
                <p className="text-xl font-bold text-ink">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <DashboardIllustration />
      </div>
    </section>
  );
}
