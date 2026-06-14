import Image from 'next/image';
import { SERVICES_DATA } from './landing-data';
import { SectionHeading } from './SectionHeading';
import { CheckCircle2 } from 'lucide-react';

export function ServicesSection() {
  return (
    <section id="services" className="relative py-24 lg:py-32 px-4 lg:px-8 bg-slate-950 overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-20">
          <SectionHeading
            badge="Enterprise Ecosystem"
            title="Core Sovereign Services"
            description="Experience the pinnacle of business orchestration with our two primary enterprise platforms."
            light={false}
          />
        </div>

        <div className="grid gap-20">
          {SERVICES_DATA.map((service, index) => (
            <div
              key={service.id}
              className={`flex flex-col lg:flex-row gap-12 lg:items-center ${
                index % 2 !== 0 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Image/Visual Part */}
              <div className="flex-1 perspective-1000 group">
                <div className="relative glass-panel rounded-[2rem] p-3 transition-all duration-700 group-hover:rotate-y-3 group-hover:rotate-x-1">
                  <div className="relative h-[300px] sm:h-[450px] overflow-hidden rounded-[1.5rem] border border-white/5">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  </div>
                  
                  {/* Floating Architecture Badge */}
                  <div className="absolute -bottom-6 -right-6 glass-panel p-4 rounded-2xl border-white/20 hidden sm:block shadow-2xl">
                    <div className="flex flex-col gap-1">
                      {(service.id === 'hrms'
                        ? ['BullMQ Engine', 'pgvector AI', 'OTel Traced']
                        : ['Helm + HPA', 'Multi-Tenant', 'dnd-kit Canvas']
                      ).map(t => (
                        <span key={t} className="text-[9px] font-mono text-emerald-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-emerald-400" />{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Part */}
              <div className="flex-1 space-y-8 animate-rise">
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full glass-panel text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-6 border-white/10">
                    {service.badge}
                  </span>
                  <h3 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
                    {service.title}
                  </h3>
                  <p className="text-xl font-medium bg-gradient-to-r from-slate-200 to-slate-500 bg-clip-text text-transparent">
                    {service.subtitle}
                  </p>
                </div>

                <p className="text-lg text-slate-400 leading-relaxed font-light">
                  {service.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-4 pt-6">
                  {service.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-1 p-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-8">
                  <button className="px-8 py-4 rounded-full border border-white/10 glass-button text-white font-bold text-sm hover:border-white/30 transition-all group">
                    Explore Infrastructure 
                    <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
