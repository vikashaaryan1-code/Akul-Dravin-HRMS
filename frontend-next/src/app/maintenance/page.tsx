import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance — Akul Dravin HRMS AI',
  description:
    'The Akul Dravin platform is temporarily undergoing scheduled maintenance. We will be back shortly.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main
      role="main"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 bg-[#0A1E3A] overflow-hidden"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#1E68E5]/8 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #94A3B8 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 flex max-w-lg flex-col items-center gap-8 text-center">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-4 py-2">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD700] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD700]" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FFD700]">
            Scheduled Maintenance
          </span>
        </div>

        {/* Icon */}
        <div
          className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md"
          aria-hidden="true"
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#FFD700]"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            We&apos;re upgrading the platform
          </h1>
          <p className="mx-auto max-w-sm text-base text-slate-400 leading-relaxed">
            The Akul Dravin HRMS AI platform is currently undergoing scheduled maintenance to bring
            you new features and performance improvements.
          </p>
          <p className="text-sm text-[#00E5AB] font-semibold">
            Expected completion: Shortly
          </p>
        </div>

        {/* What's being updated */}
        <div className="w-full rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md p-6">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            What&apos;s being updated
          </p>
          <ul className="space-y-3 text-left" aria-label="Maintenance tasks">
            {[
              { task: 'Performance optimizations', status: '✅' },
              { task: 'Security patches applied', status: '✅' },
              { task: 'Database migrations running', status: '🔄' },
              { task: 'Final health checks', status: '⏳' },
            ].map(({ task, status }) => (
              <li
                key={task}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-slate-300">{task}</span>
                <span aria-label={status} className="ml-4">
                  {status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <p className="text-sm text-slate-500">
          Need urgent support?{' '}
          <a
            href="mailto:support@akuldravin.com"
            className="text-[#00E5AB] hover:text-white transition-colors font-semibold"
          >
            support@akuldravin.com
          </a>
        </p>

        {/* Social links */}
        <div className="flex gap-4">
          <a
            href="https://twitter.com/akuldravin"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-all"
            aria-label="Follow on Twitter for updates"
          >
            𝕏 Twitter Updates
          </a>
          <a
            href="https://status.akuldravin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            System Status
          </a>
        </div>
      </div>
    </main>
  );
}
