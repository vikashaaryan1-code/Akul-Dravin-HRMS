'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, FileSearch, Globe, Cpu, AlertTriangle } from 'lucide-react';

const PILLARS = [
  {
    icon: ShieldCheck, color: 'text-jade', border: 'border-jade/20', bg: 'bg-jade/5',
    title: 'GDPR & ISO 27001',
    desc: 'Full data subject rights, consent management, and ISO-aligned information security controls across all tenants.',
  },
  {
    icon: Lock, color: 'text-gold', border: 'border-gold/20', bg: 'bg-gold/5',
    title: 'SOC 2 Type II',
    desc: 'Continuous monitoring, availability SLAs, and independently audited security, availability, and confidentiality commitments.',
  },
  {
    icon: Eye, color: 'text-aqua', border: 'border-aqua/20', bg: 'bg-aqua/5',
    title: 'Zero-Trust Architecture',
    desc: 'Every request is verified — no implicit trust. Continuous identity validation with microsegmented access controls.',
  },
  {
    icon: Lock, color: 'text-ember', border: 'border-ember/20', bg: 'bg-ember/5',
    title: 'AES-256 Encryption',
    desc: 'Data encrypted at rest and in transit using AES-256-GCM. Key rotation enforced per tenant with HSM-backed vaults.',
  },
  {
    icon: FileSearch, color: 'text-gold', border: 'border-gold/20', bg: 'bg-gold/5',
    title: 'Immutable Audit Logs',
    desc: 'Every state change, approval, and access event is forensically locked — tamper-evident and replay-safe.',
  },
  {
    icon: Globe, color: 'text-jade', border: 'border-jade/20', bg: 'bg-jade/5',
    title: 'Regional Data Isolation',
    desc: 'Multi-region deployment with sovereignty controls. Choose your data residency — EU, APAC, MEA, or air-gap.',
  },
  {
    icon: Cpu, color: 'text-aqua', border: 'border-aqua/20', bg: 'bg-aqua/5',
    title: 'AI Governance',
    desc: 'All AI decisions are explainable, auditable, and override-able. No autonomous action without human review gate.',
  },
  {
    icon: AlertTriangle, color: 'text-ember', border: 'border-ember/20', bg: 'bg-ember/5',
    title: 'Threat Mitigation',
    desc: 'Real-time behavioral drift detection with automated anomaly blocking within 50ms. SIEM-ready event streams.',
  },
] as const;

export function SecuritySection() {
  return (
    <section id="security" className="py-28" aria-labelledby="security-heading">
      <div className="container-brand">
        <div className="text-center mb-16">
          <p className="section-label text-jade mb-3">Security & Compliance</p>
          <h2
            id="security-heading"
            className="text-4xl lg:text-6xl font-black tracking-tighter leading-none text-white"
          >
            Institutional-Grade
            <br />
            <span className="text-gradient-gold">Trust Architecture</span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto">
            Security is not a feature — it is the foundation. Every layer of the platform is hardened by design.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-2xl border ${pillar.border} ${pillar.bg} p-6 flex flex-col gap-4
                hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className={`h-10 w-10 rounded-xl bg-white/5 border ${pillar.border} flex items-center justify-center`}>
                <pillar.icon className={`h-5 w-5 ${pillar.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className={`text-sm font-black ${pillar.color}`}>{pillar.title}</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{pillar.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Infra strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 surface-raised border-subtle rounded-2xl p-6 flex flex-wrap justify-center gap-8"
          aria-label="Infrastructure certifications"
        >
          {['99.99% Uptime SLA', 'SOC 2 Type II', 'ISO 27001', 'GDPR', 'PCI-DSS Ready', 'Air-Gap Deployable', 'Zero-Trust Verified'].map(
            (cert) => (
              <div key={cert} className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-jade" aria-hidden="true" />
                <span className="text-xs font-bold text-slate-300">{cert}</span>
              </div>
            ),
          )}
        </motion.div>
      </div>
    </section>
  );
}
