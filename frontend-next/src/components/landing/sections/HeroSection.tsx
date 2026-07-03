'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldCheck, Zap, Globe, Users } from 'lucide-react';
import type { PublicLandingPayload } from '@/lib/public-site';

type Props = { hero: PublicLandingPayload['hero'] };

const FLOAT_CARDS = [
 { icon: Users, label: 'Active Employees', value: '12,400', color: 'text-gold' },
 { icon: Zap, label: 'Automations Today', value: '3,280', color: 'text-aqua' },
 { icon: ShieldCheck, label: 'Compliance Score', value: '99.8%', color: 'text-jade' },
 { icon: Globe, label: 'Countries Served', value: '34', color: 'text-ember' },
] as const;

const fadeUp = {
 hidden: { opacity: 0, y: 24 },
 show: (i: number) => ({
 opacity: 1,
 y: 0,
 transition: { delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
 }),
};

export function HeroSection({ hero }: Props) {
 return (
 <section
 id="top"
 className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden"
 aria-label="Hero"
 >
 {/* Animated mesh background */}
 <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
 <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gold/5 blur-[120px] animate-pulse-slow" />
 <div className="absolute bottom-0 left-1/4 h-[400px] w-[600px] rounded-full bg-ember/5 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
 <div className="absolute top-1/3 right-0 h-[300px] w-[400px] rounded-full bg-aqua/5 blur-[80px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
 {/* Grid */}
 <div
 className="absolute inset-0 opacity-[0.05]"
 style={{
 backgroundImage:
 'linear-gradient(rgba(242,170,59,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(242,170,59,0.3) 1px,transparent 1px)',
 backgroundSize: '80px 80px',
 }}
 />
 </div>

 <div className="container-brand relative z-10">
 <div className="flex flex-col items-center text-center max-w-[1000px] mx-auto gap-8">

 {/* Badge */}
 <motion.div
 custom={0} variants={fadeUp} initial="hidden" animate="show"
 className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-navy/10 bg-navy/[0.04] backdrop-blur-xl"
 >
 <span className="h-2 w-2 rounded-full bg-jade animate-pulse-live" aria-hidden="true" />
 <span className="section-label text-gold/90">{hero.badge}</span>
 </motion.div>

 {/* Announcement ticker */}
 <motion.p
 custom={1} variants={fadeUp} initial="hidden" animate="show"
 className="text-xs font-semibold tracking-wide text-slate-500 max-w-2xl"
 >
 {hero.announcement}
 </motion.p>

 {/* Headline */}
 <motion.h1
 custom={2} variants={fadeUp} initial="hidden" animate="show"
 className="text-[clamp(2.6rem,7vw,6.5rem)] font-black tracking-tightest leading-[0.92] text-navy"
 >
 <span className="text-gradient-gold">Sovereign AI</span>
 <br />
 Business Operating System
 </motion.h1>

 {/* Subtitle */}
 <motion.p
 custom={3} variants={fadeUp} initial="hidden" animate="show"
 className="max-w-[680px] text-lg lg:text-xl text-slate-500 leading-relaxed"
 >
 {hero.description}
 </motion.p>

 {/* CTAs */}
 <motion.div
 custom={4} variants={fadeUp} initial="hidden" animate="show"
 className="flex flex-col sm:flex-row gap-4 pt-2"
 >
 <Link
 href={hero.primaryCta.href}
 id="hero-primary-cta"
 className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-gold to-ember text-white text-sm font-black uppercase tracking-wide shadow-ember-md hover:shadow-ember-lg hover:scale-105 active:scale-95 transition-all duration-300"
 >
 {hero.primaryCta.label}
 <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
 </Link>
 <Link
 href={hero.secondaryCta.href}
 id="hero-secondary-cta"
 className="inline-flex items-center gap-2 px-8 py-4 rounded-full surface-raised border-subtle text-sm font-bold text-navy hover:bg-navy/10 transition-all duration-300"
 >
 {hero.secondaryCta.label}
 </Link>
 </motion.div>

 {/* Trust indicators */}
 <motion.div
 custom={5} variants={fadeUp} initial="hidden" animate="show"
 className="flex flex-wrap justify-center gap-x-8 gap-y-3 pt-4"
 >
 {['SOC 2 Type II', 'ISO 27001', 'GDPR Ready', 'Zero-Trust'].map((badge) => (
 <div key={badge} className="flex items-center gap-1.5 text-slate-500">
 <ShieldCheck className="h-3.5 w-3.5 text-jade" aria-hidden="true" />
 <span className="text-xs font-semibold">{badge}</span>
 </div>
 ))}
 </motion.div>
 </div>

 {/* Floating Dashboard Cards */}
 <motion.div
 initial={{ opacity: 0, y: 40 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
 className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4"
 aria-label="Platform metrics preview"
 >
 {FLOAT_CARDS.map((card) => (
 <div
 key={card.label}
 className="glass-3d-panel p-6 flex flex-col gap-4 group"
 >
 <div className="flex items-center justify-between">
 <card.icon className={`h-5 w-5 ${card.color}`} aria-hidden="true" />
 <span className="h-1.5 w-1.5 rounded-full bg-jade animate-pulse-live" aria-hidden="true" />
 </div>
 <div>
 <p className={`text-2xl font-black tracking-tight ${card.color}`}>{card.value}</p>
 <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
 </div>
 </div>
 ))}
 </motion.div>
 </div>

 {/* Scroll cue */}
 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30" aria-hidden="true">
 <span className="section-label text-slate-500">Scroll</span>
 <div className="h-8 w-px bg-gradient-to-b from-navy/40 to-transparent" />
 </div>
 </section>
 );
}
