'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Zap, 
  History, 
  Lock, 
  Globe, 
  Fingerprint,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

const FEATURE_CLUSTERS = [
  {
    title: "Node 8 Autonomous Engine",
    eyebrow: "Governance",
    description: "The world's first self-regulating financial nervous system. Node 8 monitors system-wide drift and autonomously stabilizes operations in real-time.",
    icon: Cpu,
    color: "blue",
    points: [
      "Autonomic Throttling: Intelligent latency injection during bursts",
      "Soft Quarantine: Automated mutation blocking for unstable accounts",
      "Self-Healing Circuits: Automatic re-balancing of integrity scores",
      "Vascular Pressure Maps: Real-time telemetry of system saturation"
    ]
  },
  {
    title: "Deterministic Financial Ledger",
    eyebrow: "Integrity",
    description: "Absolute truth through mathematical certainty. Every transaction is a non-repudiable event protected by double-entry invariants.",
    icon: Lock,
    color: "amber",
    points: [
      "Cryptographic Non-Repudiation: HMAC-SHA256 payload signing",
      "Idempotency Guard: 24h atomic intake valves for zero duplicates",
      "Deterministic Hashing: Dry-run simulation before commitment",
      "Multilateral Balance: Strict Zero-Sum floor invariant enforcement"
    ]
  },
  {
    title: "Forensic Global Traceability",
    eyebrow: "Observability",
    description: "Complete visibility into the lifecycle of every decision. Connect the dots from user action to financial impact with zero ambiguity.",
    icon: Fingerprint,
    color: "emerald",
    points: [
      "Global Trace Corritidor: Correlate TraceID across API, Redis & Logs",
      "Audit Golden Chains: Tamper-evident history of state transitions",
      "Dead-Letter Spillway: Forensic isolation of unprocessable events",
      "Compliance Replay: Re-materialize ledger state from event logs"
    ]
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#04101f] text-white selection:bg-amber/30 selection:text-white">
      <LandingNavbar />

      <main className="relative pt-24">
        {/* Glow Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[40%] bg-amber-500/5 blur-[100px]" />
        </div>

        {/* Hero Section */}
        <section className="relative px-4 py-20 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400"
            >
              <Sparkles className="w-3 h-3" />
              Platform Capabilities
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold tracking-tighter"
            >
              The Architecture of <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Absolute Certainty</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto"
            >
              OMNIX is not just an ERP; it's a self-regulating operating system for high-stakes business logic and financial truth.
            </motion.p>
          </div>
        </section>

        {/* Interactive Feature Clusters */}
        <section className="px-4 py-20 lg:px-8 max-w-7xl mx-auto space-y-32">
          {FEATURE_CLUSTERS.map((cluster, idx) => (
            <div key={cluster.title} className={`grid lg:grid-cols-2 gap-16 items-center ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
              <motion.div 
                initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <span className="text-xs font-black uppercase tracking-[0.4em] text-white/30">{cluster.eyebrow}</span>
                  <h2 className="text-4xl font-bold tracking-tight">{cluster.title}</h2>
                  <p className="text-lg text-slate-400 leading-relaxed">
                    {cluster.description}
                  </p>
                </div>

                <div className="grid gap-4">
                  {cluster.points.map((point) => (
                    <div key={point} className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 group-hover:scale-150 transition-transform" />
                      <p className="text-sm text-slate-300 font-medium">{point}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative aspect-square"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-[3rem] blur-2xl" />
                <div className="relative h-full w-full ultra-glass rounded-[3.5rem] border border-white/10 flex items-center justify-center p-12">
                   <cluster.icon className={`w-32 h-32 ${
                     cluster.color === 'blue' ? 'text-blue-400/80' : 
                     cluster.color === 'amber' ? 'text-amber-400/80' : 'text-emerald-400/80'
                   } drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]`} />
                </div>
              </motion.div>
            </div>
          ))}
        </section>

        {/* Conversion CTA */}
        <section className="px-4 py-32 lg:px-8 border-t border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="text-4xl font-bold tracking-tight">Ready to certify your operations?</h2>
            <p className="text-slate-400">Experience the power of an autonomous financial OS today.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/login" 
                className="px-8 py-4 rounded-full bg-white text-[#04101f] font-bold text-sm tracking-widest hover:scale-105 transition-transform"
              >
                GET STARTED
              </Link>
              <Link 
                href="/pricing" 
                className="px-8 py-4 rounded-full border border-white/10 bg-white/5 text-white font-bold text-sm tracking-widest hover:bg-white/10 transition-colors"
              >
                VIEW PRICING
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
