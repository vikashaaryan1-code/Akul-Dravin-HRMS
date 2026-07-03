import { PLATFORM_STATS } from './landing-data';

export function PlatformStatsSection() {
 return (
 <section className="px-4 py-12 lg:px-8 lg:py-16">
 <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/70 bg-white/90 px-6 py-8 shadow-panel sm:px-8">
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
 {PLATFORM_STATS.map((item) => (
 <article key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
 <p className="text-3xl font-bold text-ink">{item.value}</p>
 <p className="mt-1 text-sm text-slate-600">{item.label}</p>
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}
