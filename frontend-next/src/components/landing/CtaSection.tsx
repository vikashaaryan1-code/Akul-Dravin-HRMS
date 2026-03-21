import Link from 'next/link';

export function CtaSection() {
  return (
    <section id="contact" className="px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/60 bg-ink px-6 py-12 text-white shadow-panel sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Next Step</p>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl">
              Modernize Your Office Operations with AI
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              Replace disconnected tools with one enterprise HRMS platform covering attendance, permissions, productivity, location, payroll, and performance analytics.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/subscription"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-ember to-amber px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Start Free Trial
            </Link>
            <Link
              href="/dashboard?role=platform-admin"
              className="inline-flex items-center justify-center rounded-full border border-white/35 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


