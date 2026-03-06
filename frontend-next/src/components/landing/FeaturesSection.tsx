import { FEATURE_ITEMS } from './landing-data';
import { SectionHeading } from './SectionHeading';

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <SectionHeading
          eyebrow="Core Features"
          title="Enterprise-grade capabilities across HRMS and ERP"
          description="Run salary, payroll, documents, recruitment, and intelligence workflows from a single AI-powered operating platform."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {FEATURE_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="animate-rise rounded-3xl border border-white/70 bg-white/90 p-5 shadow-panel backdrop-blur"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ember/15 to-amber/20 text-ember">
                  <Icon className="h-5 w-5" aria-hidden="true" />
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
