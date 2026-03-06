import Link from 'next/link';
import { PRICING_BULLET_ICON, PRICING_PLANS } from './landing-data';
import { SectionHeading } from './SectionHeading';

const BulletIcon = PRICING_BULLET_ICON;

export function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <SectionHeading
          eyebrow="Pricing"
          title="Plans built for startups to global enterprises"
          description="Start quickly, scale confidently, and unlock deeper automation as your workforce operations grow."
        />

        <div className="grid gap-4 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-3xl border p-6 shadow-panel ${
                plan.featured
                  ? 'border-amber/50 bg-gradient-to-b from-white to-amber/10'
                  : 'border-white/80 bg-white'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{plan.name}</p>
              <p className="mt-3 text-3xl font-bold text-ink">{plan.price}</p>
              <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{plan.description}</p>

              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <BulletIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === 'Enterprise' ? '#contact' : '/signup'}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  plan.featured
                    ? 'bg-gradient-to-r from-ember to-amber text-white hover:opacity-90'
                    : 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
