import { MARKETPLACE_ITEMS } from './landing-data';
import { SectionHeading } from './SectionHeading';

export function MarketplaceSection() {
  return (
    <section id="marketplace" className="px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <SectionHeading
          eyebrow="Marketplace"
          title="Recruitment marketplace engineered for scale"
          description="Unify companies, recruiters, and candidates with measurable outcomes, AI matching, and governance-first hiring workflows."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {MARKETPLACE_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="animate-rise rounded-3xl border border-white/80 bg-white p-6 shadow-panel"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ember/15 via-amber/15 to-white text-ember">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
