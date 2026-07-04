'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const BRANDS = ['SAP', 'WORKDAY', 'RIPPLING', 'DEEL', 'STRIPE', 'ZOHO', 'ORACLE', 'BAMBOOHR', 'GUSTO', 'ADP'] as const;
const COMPLIANCE = ['GDPR', 'SOC 2', 'ISO 27001', 'HIPAA', 'PCI-DSS', 'Zero Trust'] as const;
const INFRA = ['99.99% Uptime', 'AES-256 Encrypted', 'Multi-Region', 'Air-Gap Ready'] as const;

export function TrustTicker() {
 const ref = useRef<HTMLDivElement>(null);
 const inView = useInView(ref, { once: true });

 return (
 <section
 ref={ref}
 className="py-16 border-y border-white/10 overflow-hidden bg-[#0A1E3A]/40 backdrop-blur-md"
 aria-label="Trust signals and enterprise brands"
 >
 {/* Brand strip */}
 <div className="container-brand mb-8">
 <p className="section-label text-slate-400 text-center mb-8 uppercase tracking-widest font-bold text-xs">
 Trusted by enterprise teams globally
 </p>
 </div>

 {/* Scrolling brand ticker */}
 <div className="relative flex overflow-hidden select-none" aria-hidden="true">
 {/* Fading edges */}
 <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-navy to-transparent z-10"></div>
 <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-navy to-transparent z-10"></div>

 <div className="flex animate-ticker whitespace-nowrap">
 {[...BRANDS, ...BRANDS].map((brand, i) => (
 <span
 key={`${brand}-${i}`}
 className="mx-10 text-2xl font-black tracking-tighter italic text-white/20 hover:text-white transition-colors duration-300 drop-shadow-md cursor-pointer"
 >
 {brand}
 </span>
 ))}
 </div>
 </div>

 {/* Compliance badges + infra */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={inView ? { opacity: 1, y: 0 } : {}}
 transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
 className="container-brand mt-10 flex flex-wrap justify-center gap-3"
 >
 {COMPLIANCE.map((badge) => (
 <span
 key={badge}
 className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-jade/20 bg-jade/5 text-xs font-bold text-jade/80"
 >
 <span className="h-1.5 w-1.5 rounded-full bg-jade" aria-hidden="true" />
 {badge}
 </span>
 ))}
 {INFRA.map((item) => (
 <span
 key={item}
 className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-aqua/20 bg-aqua/5 text-xs font-bold text-aqua/80"
 >
 <span className="h-1.5 w-1.5 rounded-full bg-aqua" aria-hidden="true" />
 {item}
 </span>
 ))}
 </motion.div>


 </section>
 );
}
