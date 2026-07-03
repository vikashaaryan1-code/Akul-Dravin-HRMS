'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import type { PublicLandingPayload } from '@/lib/public-site';

type Props = { metrics: PublicLandingPayload['metrics'] };

function useCountUp(target: string, isActive: boolean) {
 const [display, setDisplay] = useState('0');

 useEffect(() => {
 if (!isActive) return;
 const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));
 const suffix = target.replace(/[0-9.]/g, '');
 if (isNaN(numeric)) { setDisplay(target); return; }
 const isInteger = !target.replace(suffix, '').includes('.');
 let start = 0;
 const duration = 1800;
 const step = 16;
 const increment = numeric / (duration / step);
 const timer = setInterval(() => {
 start = Math.min(start + increment, numeric);
 const formatted = isInteger
 ? Math.floor(start).toString()
 : start.toFixed(1);
 setDisplay(`${formatted}${suffix}`);
 if (start >= numeric) clearInterval(timer);
 }, step);
 return () => clearInterval(timer);
 }, [isActive, target]);

 return display;
}

function MetricCard({
 metric,
 index,
 isActive,
}: {
 metric: PublicLandingPayload['metrics'][number];
 index: number;
 isActive: boolean;
}) {
 const value = useCountUp(metric.value, isActive);

 return (
 <motion.div
 initial={{ opacity: 0, y: 32 }}
 animate={isActive ? { opacity: 1, y: 0 } : {}}
 transition={{ delay: index * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
 className="glass-3d-panel p-8 group flex flex-col gap-4"
 >
 <div className="flex items-start justify-between">
 <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
 <TrendingUp className="h-5 w-5 text-gold" aria-hidden="true" />
 </div>
 <span className="section-label text-slate-600">Live</span>
 </div>
 <div>
 <p
 className="text-4xl lg:text-5xl font-black tracking-tighter text-gradient-gold"
 aria-label={`${metric.value} ${metric.label}`}
 >
 {value}
 </p>
 <p className="text-base font-bold text-navy mt-1">{metric.label}</p>
 <p className="text-sm text-slate-500 mt-1 leading-relaxed">{metric.detail}</p>
 </div>
 </motion.div>
 );
}

export function MetricsGrid({ metrics }: Props) {
 const ref = useRef<HTMLDivElement>(null);
 const inView = useInView(ref, { once: true, margin: '-100px' });

 return (
 <section
 id="metrics"
 ref={ref}
 className="py-28 bg-depth-1/40"
 aria-labelledby="metrics-heading"
 >
 <div className="container-brand">
 <div className="text-center mb-16">
 <p className="section-label text-gold mb-3">By The Numbers</p>
 <h2
 id="metrics-heading"
 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none text-navy"
 >
 Platform at Scale
 </h2>
 <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
 Real-time operational intelligence across every business domain.
 </p>
 </div>

 <div
 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
 role="list"
 aria-label="Platform metrics"
 >
 {metrics.map((m, i) => (
 <div key={m.label} role="listitem">
 <MetricCard metric={m} index={i} isActive={inView} />
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
