'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
 Mail, 
 MapPin, 
 Phone, 
 Globe, 
 ShieldCheck, 
 MessageSquare,
 Sparkles
} from 'lucide-react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingLeadHub } from '@/components/landing/LandingLeadHub';

export default function ContactPage() {
 return (
 <div className="min-h-screen bg-void text-white selection:bg-aqua/30">
 <LandingNavbar />

 <main className="relative pt-24 overflow-hidden">
 {/* Glow Effects */}
 <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-aqua/5 blur-[120px] pointer-events-none" />
 <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-ember/5 blur-[120px] pointer-events-none" />

 {/* Hero */}
 <section className="relative px-4 py-20 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="space-y-6 max-w-3xl mx-auto"
 >
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4">
 <MessageSquare className="w-3 h-3" />
 Sovereign Inquiries
 </div>
 <h1 className="text-5xl lg:text-7xl font-black tracking-tighter">
 Start Your <br />
 <span className="bg-gradient-to-r from-aqua via-cyan to-jade bg-clip-text text-transparent">Autonomic Journey</span>
 </h1>
 <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
 Connect with our enterprise architecture team. Let's discuss your scaling requirements and sovereign data strategy.
 </p>
 </motion.div>
 </section>

 {/* Contact Theater */}
 <section className="px-4 py-12 lg:px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
 <motion.div 
 initial={{ opacity: 0, x: -30 }}
 animate={{ opacity: 1, x: 0 }}
 className="space-y-12"
 >
 <div className="space-y-8">
 <div className="flex gap-6 items-start group">
 <div className="w-12 h-12 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-center text-aqua group-hover:bg-aqua/10 transition-colors">
 <Globe className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-white tracking-tight">Global Headquarters</h4>
 <p className="text-sm text-slate-500 mt-1 leading-relaxed">
 Sovereign Plaza, Level 88 <br />
 Financial District, Singapore 018981
 </p>
 </div>
 </div>

 <div className="flex gap-6 items-start group">
 <div className="w-12 h-12 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-center text-jade group-hover:bg-jade/10 transition-colors">
 <Mail className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-white tracking-tight">Enterprise Inquiries</h4>
 <p className="text-sm text-slate-500 mt-1">sovereign@akul-dravin.io</p>
 <p className="text-sm text-slate-500">compliance@akul-dravin.io</p>
 </div>
 </div>

 <div className="flex gap-6 items-start group">
 <div className="w-12 h-12 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-center text-gold group-hover:bg-gold/10 transition-colors">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-white tracking-tight">Operational Support</h4>
 <p className="text-sm text-slate-500 mt-1">24/7 Autonomic Monitoring Active</p>
 <p className="text-xs font-mono text-white/40 mt-2 uppercase tracking-widest">support_token: forensic-active-88</p>
 </div>
 </div>
 </div>

 <div className="p-8 glass-3d-panel">
 <div className="flex items-center gap-3 mb-4 text-aqua">
 <Sparkles className="w-5 h-5" />
 <span className="text-xs font-black uppercase tracking-widest">Chaos Ready</span>
 </div>
 <p className="text-sm text-slate-500 leading-relaxed">
 Our contact infrastructure is protected by the same Node 8 Autonomic Engine that powers our ledger. Your inquiries are forensic and secure.
 </p>
 </div>
 </motion.div>

 <motion.div 
 initial={{ opacity: 0, x: 30 }}
 animate={{ opacity: 1, x: 0 }}
 className="glass-3d-panel p-8 lg:p-12 relative"
 >
 <div className="absolute -top-6 -right-6 p-4 rounded-3xl bg-jade shadow-jade-md rotate-12">
 <ShieldCheck className="w-8 h-8 text-white" />
 </div>
 <LandingLeadHub />
 </motion.div>
 </section>

 {/* Global Network Map Placeholder / Graphic */}
 <section className="px-4 py-40 lg:px-8 max-w-4xl mx-auto text-center">
 <div className="inline-block relative">
 <div className="absolute inset-0 bg-aqua/20 blur-3xl rounded-full" />
 <Globe className="w-40 h-40 text-aqua/30 relative animate-[spin_20s_linear_infinite]" />
 </div>
 <p className="text-xs font-black text-white/30 uppercase tracking-[0.5em] mt-12">Universal Hub Connectivity Active</p>
 </section>
 </main>

 <LandingFooter />
 </div>
 );
}
