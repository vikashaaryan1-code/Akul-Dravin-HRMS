import Link from 'next/link';
import { FOOTER_LINKS, SOCIAL_LINKS } from './landing-data';

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-slate-600 transition hover:text-ink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/70 bg-white/80 px-4 pb-8 pt-14 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-ink">
            <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-ember to-amber" />
            AKUL DRAVIN
          </p>
          <p className="max-w-md text-sm leading-7 text-slate-600">
            AI-powered HRMS & ERP platform for payroll, recruitment, document automation, and workforce intelligence.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {SOCIAL_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold uppercase text-slate-600 transition hover:border-slate-400 hover:text-ink"
              >
                {item.short}
              </Link>
            ))}
          </div>
        </div>

        <FooterColumn title="Company" links={FOOTER_LINKS.company} />
        <FooterColumn title="Product" links={FOOTER_LINKS.product} />
        <FooterColumn title="Legal" links={FOOTER_LINKS.legal} />
      </div>

      <div className="mx-auto mt-10 grid max-w-7xl gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-panel sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
        <div>
          <p className="text-sm font-semibold text-ink">Join the product newsletter</p>
          <p className="text-xs text-slate-500">Get release notes, workflow templates, and AI automation playbooks.</p>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row" action="#" method="post">
          <label htmlFor="newsletter-email" className="sr-only">
            Email
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            placeholder="name@company.com"
            className="min-w-[220px] rounded-full border border-slate-300 px-4 py-2 text-sm text-ink outline-none transition focus:border-ember"
          />
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-ember to-amber px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Subscribe
          </button>
        </form>
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-slate-200 pt-5 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} AKUL DRAVIN HRMS & ERP v1000.0. All rights reserved.</p>
      </div>
    </footer>
  );
}


