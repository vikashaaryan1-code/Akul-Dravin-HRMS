import { TESTIMONIALS } from './landing-data';
import { SectionHeading } from './SectionHeading';

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <SectionHeading
          eyebrow="Testimonials"
          title="Trusted by teams scaling people operations globally"
          description="Organizations across finance, technology, and workforce services rely on AKUL DRAVIN HRMS & ERP to automate high-impact operations."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <article
              key={item.name}
              className="animate-rise rounded-3xl border border-white/80 bg-white p-6 shadow-panel"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <p className="text-sm leading-7 text-slate-700">"{item.quote}"</p>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-base font-semibold text-ink">{item.name}</p>
                <p className="text-sm text-slate-500">{item.company}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

