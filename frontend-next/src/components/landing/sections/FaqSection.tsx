'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { PublicLandingPayload } from '@/lib/public-site';

type Props = { faq: PublicLandingPayload['faq'] };

export function FaqSection({ faq }: Props) {
 const [open, setOpen] = useState<number | null>(0);

 return (
 <section id="faq" className="py-28 bg-[#051124]/60" aria-labelledby="faq-heading">
 <div className="container-brand max-w-[860px]">
 <div className="text-center mb-16">
 <p className="section-label text-gold mb-3">FAQ</p>
 <h2
 id="faq-heading"
 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none text-white"
 >
 Common Questions
 </h2>
 </div>

 <dl className="space-y-3">
 {faq.map((item, i) => {
 const isOpen = open === i;
 return (
 <motion.div
 key={item.question}
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.07, duration: 0.5 }}
 className={`surface-raised border-subtle rounded-2xl overflow-hidden transition-all duration-300 ${
 isOpen ? 'border-gold/20 shadow-gold-sm' : 'hover:bg-[#0A1E3A]/5'
 }`}
 >
 <dt>
 <button
 id={`faq-btn-${i}`}
 aria-expanded={isOpen}
 aria-controls={`faq-panel-${i}`}
 onClick={() => setOpen(isOpen ? null : i)}
 className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
 >
 <span className="font-bold text-white text-sm lg:text-base leading-snug">
 {item.question}
 </span>
 <ChevronDown
 className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${
 isOpen ? 'rotate-180 text-gold' : ''
 }`}
 aria-hidden="true"
 />
 </button>
 </dt>
 <AnimatePresence initial={false}>
 {isOpen && (
 <motion.dd
 id={`faq-panel-${i}`}
 role="region"
 aria-labelledby={`faq-btn-${i}`}
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
 className="overflow-hidden"
 >
 <p className="px-6 pb-6 text-sm text-slate-400 leading-relaxed">
 {item.answer}
 </p>
 </motion.dd>
 )}
 </AnimatePresence>
 </motion.div>
 );
 })}
 </dl>
 </div>
 </section>
 );
}
