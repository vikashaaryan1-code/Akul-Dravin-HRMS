'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Rocket, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Building2, 
  Globe,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PRICING_PLANS } from '@/components/landing/landing-data';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#04101f] text-white selection:bg-amber/30">
      <LandingNavbar />

      <main className="relative pt-24">
        {/* Glow Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px]" />
          <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px]" />
        </div>

        {/* Hero */}
        <section className="relative px-4 py-20 lg:px-8 max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              Sovereign Commercials
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter">
              Invest in <br />
              <span className="bg-gradient-to-r from-amber-400 via-ember to-rose-400 bg-clip-text text-transparent">Total Control</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Choose the tier that matches your organization's vascular scale. From agile startups to global sovereign entities.
            </p>
          </motion.div>
        </section>

        {/* Pricing Matrix */}
        <section className="px-4 py-12 lg:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan, idx) => (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex flex-col rounded-[2.5rem] border p-8 transition-all hover:translate-y-[-8px] relative overflow-hidden group ${
                  plan.featured 
                    ? 'border-amber-500/30 bg-white/[0.04] shadow-[0_20px_50px_rgba(242,170,59,0.1)]' 
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-r from-ember to-amber rounded-bl-3xl text-[9px] font-black tracking-widest uppercase">
                    Most Adopted
                  </div>
                )}

                <div className="mb-8 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-xs text-white/30">/mo</span>}
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed mb-8 h-12 overflow-hidden">
                  {plan.description}
                </p>

                <div className="space-y-4 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-1 w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      </div>
                      <span className="text-[13px] text-slate-300 font-medium leading-tight">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.name === 'Enterprise' && (
                    <div className="mt-6 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
                       <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Chaos Certified</span>
                       </div>
                       <p className="text-[10px] text-slate-400 leading-normal">
                         Survived 10k TPS stress baptism. Includes dedicated Spillway isolation.
                       </p>
                    </div>
                  )}
                </div>

                <Link 
                  href="/login" 
                  className={`mt-10 py-4 rounded-3xl text-xs font-black tracking-widest text-center transition-all ${
                    plan.featured 
                      ? 'bg-gradient-to-r from-ember to-amber text-white shadow-[0_10px_20px_rgba(232,90,42,0.2)]' 
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {plan.cta.toUpperCase()}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Global Scalability Footnote */}
        <section className="px-4 py-32 lg:px-8 max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10">
                <Globe className="w-10 h-10 text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Sovereign Data Residency</h2>
            <p className="text-slate-400 leading-relaxed">
              Every OMNIX instance is architected for strict geographic data sovereignty. Choose your deployment region and maintain absolute control over your financial and workforce datasets.
            </p>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
