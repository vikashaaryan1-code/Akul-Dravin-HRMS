'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Globe,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PRICING_PLANS } from '@/components/landing/landing-data';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-void text-navy selection:bg-aqua/20">
      <LandingNavbar />

      <main className="relative pt-24 overflow-hidden">
        {/* Light Theme Background Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] orb orb-gold blur-[120px]" />
          <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] orb orb-aqua blur-[120px]" />
        </div>

        {/* Hero Section */}
        <section className="relative px-4 py-20 lg:px-8 max-w-7xl mx-auto text-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 text-[10px] font-black uppercase tracking-[0.3em] text-gold-dim">
              <Star className="w-3 h-3 fill-current" />
              Scalable HR Solutions
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-navy">
              Invest in <br />
              <span className="text-gradient-brand">Total Control</span>
            </h1>
            <p className="text-lg text-secondary leading-relaxed max-w-2xl mx-auto">
              Choose the tier that matches your organization's scale. From agile startups to global enterprises.
            </p>
          </motion.div>
        </section>

        {/* Pricing Matrix - Flexible Grid for 7 Tiers */}
        <section className="px-4 py-12 lg:px-8 max-w-[1600px] mx-auto z-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
            {PRICING_PLANS.map((plan, idx) => (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex flex-col rounded-[2.5rem] p-8 relative overflow-hidden group ${
                  plan.featured 
                    ? 'glass-holographic' 
                    : 'glass-3d-panel'
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-r from-gold to-gold-dim rounded-bl-3xl text-[9px] font-black tracking-widest uppercase text-white shadow-lg">
                    Most Adopted
                  </div>
                )}

                <div className="mb-8 space-y-2 z-10">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-tertiary">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-navy">{plan.price}</span>
                    {plan.price !== 'Custom' && plan.price !== '₹0' && <span className="text-xs text-secondary font-medium">/mo</span>}
                  </div>
                </div>

                <p className="text-sm text-secondary leading-relaxed mb-8 h-12 overflow-hidden z-10 font-medium">
                  {plan.description}
                </p>

                <div className="space-y-4 flex-1 z-10">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-1 w-4 h-4 rounded-full bg-jade/10 flex items-center justify-center border border-jade/20 shadow-sm">
                        <CheckCircle2 className="w-2.5 h-2.5 text-jade" />
                      </div>
                      <span className="text-[13px] text-secondary font-semibold leading-tight">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.name === 'Enterprise' && (
                    <div className="mt-6 p-4 rounded-2xl border border-aqua/20 bg-aqua/5 backdrop-blur-sm shadow-inner">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-aqua" />
                        <span className="text-[10px] font-bold text-aqua uppercase tracking-widest">Enterprise SLA</span>
                      </div>
                      <p className="text-[10px] text-secondary font-medium leading-normal">
                        Includes dedicated Server, Custom Development, and 24x7 Priority Support.
                      </p>
                    </div>
                  )}
                </div>

                <Link 
                  href="/login" 
                  className={`mt-10 py-4 rounded-3xl text-xs font-black tracking-widest text-center transition-all z-10 ${
                    plan.featured 
                      ? 'bg-gradient-to-r from-aqua to-cyan text-white shadow-lg hover:shadow-xl hover:-translate-y-1' 
                      : 'bg-white text-navy border border-slate-200 shadow-md hover:bg-slate-50 hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  {plan.cta.toUpperCase()}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Global Scalability Footnote */}
        <section className="px-4 py-32 lg:px-8 max-w-4xl mx-auto text-center space-y-8 z-10 relative">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white border border-slate-200 shadow-lg">
            <Globe className="w-10 h-10 text-aqua animate-pulse-slow" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-navy">Global Scalability & Support</h2>
          <p className="text-secondary font-medium leading-relaxed">
            From growing SMEs to massive corporate networks, AKUL DRAVIN HRMS AI scales intelligently. Enjoy seamless performance, strict data compliance, and robust API integrations across any region.
          </p>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
