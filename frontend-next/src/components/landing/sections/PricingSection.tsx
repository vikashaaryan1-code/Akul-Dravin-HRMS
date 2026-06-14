'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, ArrowUpRight, Zap } from 'lucide-react';
import type { PublicLandingPayload } from '@/lib/public-site';

type Props = { plans: PublicLandingPayload['plans'] };

export function PricingSection({ plans }: Props) {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-28" aria-labelledby="pricing-heading">
      <div className="container-brand">
        <div className="text-center mb-16">
          <p className="section-label text-gold mb-3">Pricing</p>
          <h2
            id="pricing-heading"
            className="text-4xl lg:text-6xl font-black tracking-tighter leading-none text-white"
          >
            Plans Built for
            <br />
            <span className="text-gradient-gold">Every Growth Stage</span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 max-w-xl mx-auto">
            Start lean, scale sovereign. No lock-in. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-4 surface-raised border-subtle rounded-full p-1.5">
            <button
              onClick={() => setYearly(false)}
              aria-pressed={!yearly}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-all duration-200 ${
                !yearly ? 'bg-white text-void shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              aria-pressed={yearly}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-all duration-200 ${
                yearly ? 'bg-white text-void shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-jade/20 text-jade text-[9px]">
                −20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-2xl p-8 flex flex-col gap-6 border transition-all duration-300 ${
                plan.featured
                  ? 'glass-holographic scale-[1.02]'
                  : 'glass-3d-panel hover:bg-white/8'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-gold to-ember text-void text-[10px] font-black uppercase tracking-wide shadow-gold-sm">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    Recommended
                  </span>
                </div>
              )}

              <div>
                <p className="section-label text-slate-500">{plan.name}</p>
                <p className="text-4xl font-black tracking-tighter text-white mt-2">
                  {yearly && plan.price !== 'Custom'
                    ? plan.price.replace(/\$(\d+)/, (_, n) => `$${Math.floor(+n * 0.8)}`)
                    : plan.price}
                </p>
                <p className="text-xs text-slate-500 mt-1">{plan.commitment}</p>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">{plan.description}</p>

              <ul className="space-y-3 flex-1" aria-label={`${plan.name} features`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 mt-0.5 ${plan.featured ? 'text-gold' : 'text-jade'}`}
                      aria-hidden="true"
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.price === 'Custom' ? '#contact' : '/signup'}
                id={`pricing-cta-${plan.name.toLowerCase().replace(/\s/g, '-')}`}
                className={`inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black uppercase tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                  plan.featured
                    ? 'bg-gradient-to-r from-gold to-ember text-void shadow-gold-sm hover:shadow-gold-md'
                    : 'border border-white/10 text-white hover:bg-white/8'
                }`}
              >
                {plan.cta}
                {plan.price === 'Custom' && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Enterprise CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 surface-raised border-subtle rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-gold" aria-hidden="true" />
            </div>
            <div>
              <p className="font-black text-white">Sovereign Suite — Unlimited Scale</p>
              <p className="text-sm text-slate-400 mt-0.5">
                Multi-entity, white-label, air-gap deployment. Custom SLA with dedicated success pod.
              </p>
            </div>
          </div>
          <Link
            href="#contact"
            id="pricing-sovereign-cta"
            className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-gold to-ember text-void text-sm font-black uppercase tracking-wide hover:shadow-gold-md hover:scale-105 transition-all duration-200"
          >
            Talk to Enterprise Team
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
