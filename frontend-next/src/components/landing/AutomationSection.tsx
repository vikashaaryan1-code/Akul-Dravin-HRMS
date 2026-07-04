import { AUTOMATION_ITEMS } from './landing-data';
import { SectionHeading } from './SectionHeading';

export function AutomationSection() {
 return (
 <section id="solutions" className="px-4 py-20 lg:px-8">
 <div className="mx-auto max-w-7xl space-y-10 rounded-[2rem] border border-white/80 bg-gradient-to-br from-[#f8fbff] via-white to-[#f2fbf8] p-6 shadow-panel sm:p-8 lg:p-12">
 <div id="ai-automation">
 <SectionHeading
 eyebrow="AI Automation"
 title="Autonomous workflows built for enterprise operations"
 description="Recruitment, payroll, document lifecycle, predictions, and approvals run on smart orchestration with human oversight when needed."
 centered={false}
 />
 </div>

 <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
 <div className="grid gap-4 md:grid-cols-2">
 {AUTOMATION_ITEMS.map((item, index) => {
 const Icon = item.icon;
 return (
 <article
 key={item.title}
 className="animate-rise rounded-3xl border border-slate-100 bg-white p-5 shadow-panel"
 style={{ animationDelay: `${index * 85}ms` }}
 >
 <p className="inline-flex rounded-full bg-amber/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ember">
 {item.tag}
 </p>
 <div className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-aqua">
 <Icon className="h-5 w-5" aria-hidden="true" />
 </div>
 <h3 className="mt-4 text-lg font-semibold text-ink">{item.title}</h3>
 <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
 </article>
 );
 })}
 </div>

 <aside className="relative overflow-hidden rounded-3xl border border-slate-100 bg-ink p-6 text-white shadow-panel">
 <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-amber/25 blur-3xl" />
 <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-aqua/30 blur-3xl" />
 <div className="relative space-y-5">
 <p className="text-xs uppercase tracking-[0.18em] text-white/70">Automation Control Tower</p>
 <h3 className="text-2xl font-semibold">End-to-end process intelligence</h3>
 <p className="text-sm leading-6 text-white/80">
 Trigger rules, AI models, and approvals are stitched into one engine to reduce manual effort and eliminate process gaps.
 </p>

 <div className="space-y-3 rounded-2xl border border-white/15 bg-navy/5 p-4">
 <div className="flex items-center justify-between text-sm">
 <span>Recruitment Flow</span>
 <span className="font-semibold text-emerald-300">98% automated</span>
 </div>
 <div className="h-1.5 rounded-full bg-navy/10">
 <div className="h-1.5 w-[98%] rounded-full bg-emerald-300" />
 </div>

 <div className="flex items-center justify-between text-sm">
 <span>Payroll Cycle</span>
 <span className="font-semibold text-amber-200">94% automated</span>
 </div>
 <div className="h-1.5 rounded-full bg-navy/10">
 <div className="h-1.5 w-[94%] rounded-full bg-amber-200" />
 </div>
 </div>
 </div>
 </aside>
 </div>
 </div>
 </section>
 );
}
