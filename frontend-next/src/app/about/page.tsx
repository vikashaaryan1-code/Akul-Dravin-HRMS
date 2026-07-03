'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
 Building2, 
 Target, 
 Lightbulb, 
 Brain, 
 Dna, 
 Milestone,
 ArrowRight
} from 'lucide-react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

const PHILOSOPHY_PILLARS = [
 {
 icon: Brain,
 title: "Neural Governance",
 subtitle: "Beyond Rules",
 description: "Traditional software follows rigid code; AKUL DRAVIN follows real-time intelligence. Our autonomic systems sense operational drift and stabilize your business before humans even notice."
 },
 {
 icon: Dna,
 title: "Financial DNA",
 subtitle: "Absolute Truth",
 description: "We treat the general ledger as a cryptographic nervous system. Every transaction is a signed commitment to truth, ensuring non-repudiation across your entire financial history."
 },
 {
 icon: Building2,
 title: "Sovereign Scale",
 subtitle: "Data Autonomy",
 description: "We believe in multi-tenant isolation and regional data residency. Your data is your territory, protected by the world's most advanced security and isolation guardrails."
 }
];

export default function AboutPage() {
 return (
 <div className="min-h-screen bg-void text-navy selection:bg-aqua/30">
 <LandingNavbar />

 <main className="relative pt-24 overflow-hidden">
 {/* Glow Effects */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-aqua/10 via-transparent to-transparent pointer-events-none" />
 
 {/* Hero Section */}
 <section className="relative px-4 py-24 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-navy/10 bg-navy/5 text-[10px] font-black uppercase tracking-[0.4em] text-aqua mb-8"
 >
 <Milestone className="w-3 h-3" />
 The AKUL DRAVIN Manifesto
 </motion.div>
 
 <motion.h1 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-6xl lg:text-8xl font-black tracking-tighter mb-8"
 >
 From Management <br />
 To <span className="bg-gradient-to-r from-aqua via-cyan to-jade bg-clip-text text-transparent">Autonomy</span>
 </motion.h1>
 
 <motion.p 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="text-xl text-slate-500 leading-relaxed max-w-3xl"
 >
 We are building the first self-regulating financial nervous system for the modern enterprise. 
 AKUL DRAVIN replaces administrative friction with mathematical certainty.
 </motion.p>
 </section>

 {/* Philosophy Grid */}
 <section className="px-4 py-20 lg:px-8 max-w-7xl mx-auto">
 <div className="grid md:grid-cols-3 gap-8">
 {PHILOSOPHY_PILLARS.map((pillar, idx) => (
 <motion.div 
 key={pillar.title}
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.15 }}
 className="p-10 glass-3d-panel flex flex-col gap-6 group hover:scale-105 transition-all"
 >
 <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-aqua/10 to-jade/10 border border-aqua/10 flex items-center justify-center text-aqua">
 <pillar.icon className="w-8 h-8" />
 </div>
 <div className="space-y-2">
 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-navy/30">{pillar.subtitle}</span>
 <h3 className="text-2xl font-bold">{pillar.title}</h3>
 </div>
 <p className="text-sm text-slate-500 leading-7">
 {pillar.description}
 </p>
 </motion.div>
 ))}
 </div>
 </section>

 {/* Vision Statement */}
 <section className="px-4 py-40 lg:px-8 relative">
 <div className="max-w-4xl mx-auto text-center space-y-12">
 <h2 className="text-4xl font-bold tracking-tight">The Future is Autonomous</h2>
 <div className="grid md:grid-cols-2 gap-12 text-left">
 <div className="space-y-4">
 <p className="text-sm font-bold text-aqua uppercase tracking-widest">Our Mission</p>
 <p className="text-slate-600 leading-8 italic border-l-2 border-aqua/30 pl-6">
 "To eliminate operational fatigue by transforming business administration into a resilient, self-correcting organism that protects financial truth and empowers people."
 </p>
 </div>
 <div className="space-y-4">
 <p className="text-sm font-bold text-jade uppercase tracking-widest">Our Vision</p>
 <p className="text-slate-500 leading-7">
 A world where businesses don't just 'manage' data, they inhabit a reliable state of truth. Where every workforce execution is certified, traced, and autonomous.
 </p>
 </div>
 </div>
 </div>
 </section>

 {/* Global Hub CTA */}
 <section className="px-4 py-32 lg:px-8 border-t border-navy/5 text-center">
 <h3 className="text-2xl font-bold mb-8">Scale with Sovereignty</h3>
 <div className="flex justify-center gap-6">
 <button className="flex items-center gap-3 px-8 py-4 rounded-full btn-primary font-bold text-xs tracking-widest hover:scale-105 transition-all">
 VIEW CAREERS <ArrowRight className="w-4 h-4" />
 </button>
 <button className="flex items-center gap-3 px-8 py-4 rounded-full border border-navy/10 bg-navy/5 text-navy font-bold text-xs tracking-widest hover:bg-navy/10 transition-all">
 OUR ROADMAP
 </button>
 </div>
 </section>
 </main>

 <LandingFooter />
 </div>
 );
}
