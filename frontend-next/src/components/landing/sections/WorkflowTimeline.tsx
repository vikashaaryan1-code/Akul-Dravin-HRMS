'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';
import type { PublicLandingPayload } from '@/lib/public-site';

type Props = { steps: PublicLandingPayload['operatingModel'] };

export function WorkflowTimeline({ steps }: Props) {
 return (
 <section id="workflow" className="py-28 bg-depth-1/50" aria-labelledby="workflow-heading">
 <div className="container-brand">
 <div className="text-center mb-20">
 <p className="section-label text-aqua mb-3">How It Works</p>
 <h2
 id="workflow-heading"
 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none text-navy"
 >
 AI-Orchestrated
 <br />
 <span className="text-gradient-gold">Operating Flow</span>
 </h2>
 <p className="mt-5 text-lg text-slate-500 max-w-xl mx-auto">
 From demand generation to intelligence — one continuous loop.
 </p>
 </div>

 {/* Desktop: horizontal timeline */}
 <div className="hidden lg:block relative">
 {/* Connector line */}
 <div className="absolute top-[52px] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />

 {/* AI pulse node */}
 <div className="absolute top-[38px] left-1/2 -translate-x-1/2 z-10" aria-hidden="true">
 <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold to-ember flex items-center justify-center shadow-gold-md animate-pulse-slow">
 <Sparkles className="h-4 w-4 text-void" />
 </div>
 </div>

 <div className="grid grid-cols-4 gap-6">
 {steps.map((step, i) => (
 <motion.div
 key={step.phase}
 initial={{ opacity: 0, y: 32 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-80px' }}
 transition={{ delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
 className="flex flex-col items-center text-center"
 >
 {/* Phase node */}
 <div className="relative mb-8">
 <div className="h-[104px] w-[104px] rounded-full surface-raised border-subtle flex flex-col items-center justify-center gap-1 shadow-glass">
 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Phase</span>
 <span className="text-3xl font-black text-gradient-gold">{step.phase}</span>
 </div>
 </div>

 <div className="surface-raised border-subtle rounded-2xl p-6 text-left w-full flex flex-col gap-4 hover:bg-white/8 transition-all duration-300">
 <h3 className="text-base font-black tracking-tight text-navy">{step.title}</h3>
 <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
 <ul className="space-y-2" aria-label={`Deliverables for ${step.title}`}>
 {step.deliverables.map((d) => (
 <li key={d} className="flex items-center gap-2 text-xs text-slate-500">
 <CheckCircle2 className="h-3.5 w-3.5 text-jade shrink-0" aria-hidden="true" />
 {d}
 </li>
 ))}
 </ul>
 </div>
 </motion.div>
 ))}
 </div>
 </div>

 {/* Mobile: vertical timeline */}
 <div className="lg:hidden relative pl-8">
 <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-gold/30 via-aqua/20 to-transparent" aria-hidden="true" />
 <div className="space-y-8">
 {steps.map((step, i) => (
 <motion.div
 key={step.phase}
 initial={{ opacity: 0, x: -16 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.12, duration: 0.6 }}
 className="relative"
 >
 {/* Dot */}
 <div className="absolute -left-8 top-1 h-5 w-5 rounded-full bg-gradient-to-br from-gold to-ember flex items-center justify-center shadow-gold-sm" aria-hidden="true">
 <span className="text-[8px] font-black text-void">{i + 1}</span>
 </div>
 <div className="surface-raised border-subtle rounded-2xl p-5">
 <p className="section-label text-gold mb-2">Phase {step.phase}</p>
 <h3 className="text-base font-black text-navy mb-2">{step.title}</h3>
 <p className="text-xs text-slate-500 leading-relaxed mb-4">{step.description}</p>
 <ul className="space-y-1.5">
 {step.deliverables.map((d) => (
 <li key={d} className="flex items-center gap-2 text-xs text-slate-500">
 <CheckCircle2 className="h-3 w-3 text-jade shrink-0" aria-hidden="true" />
 {d}
 </li>
 ))}
 </ul>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </div>
 </section>
 );
}
