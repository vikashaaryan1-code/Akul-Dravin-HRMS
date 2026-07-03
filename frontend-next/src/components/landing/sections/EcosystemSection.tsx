'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
 Users, CircleDollarSign, BrainCircuit, ShieldCheck,
 Store, Briefcase, BarChart3, FileStack, Cpu, type LucideIcon,
} from 'lucide-react';

type Product = {
 id: string;
 title: string;
 description: string;
 icon: LucideIcon;
 color: string;
 dotColor: string; // explicit bg-* class for Tailwind JIT safety
 glowColor: string;
 features: string[];
 span?: 'lg' | 'md' | 'sm';
};

const PRODUCTS: Product[] = [
 {
 id: 'hrms', title: 'HRMS Core', description: 'Full-cycle workforce management — hire to exit.',
 icon: Users, color: 'text-gold', dotColor: 'bg-gold', glowColor: 'shadow-gold-sm hover:shadow-gold-md',
 features: ['Employee Lifecycle', 'Attendance & Leave', 'Payroll Engine', 'Document Center'],
 span: 'lg',
 },
 {
 id: 'ats', title: 'ATS & Recruitment', description: 'AI-powered talent acquisition pipeline.',
 icon: Briefcase, color: 'text-aqua', dotColor: 'bg-aqua', glowColor: 'shadow-aqua-sm hover:shadow-aqua-md',
 features: ['Job Publishing', 'Candidate Scoring', 'Recruiter Hub', 'Interview Scheduling'],
 span: 'md',
 },
 {
 id: 'payroll', title: 'Payroll Suite', description: 'Policy-driven payroll automation.',
 icon: CircleDollarSign, color: 'text-jade', dotColor: 'bg-jade', glowColor: '',
 features: ['Payslip Generation', 'Tax Computation', 'Disbursement Logs'],
 span: 'sm',
 },
 {
 id: 'ai', title: 'AI Copilot', description: 'Conversational intelligence across every module.',
 icon: BrainCircuit, color: 'text-ember', dotColor: 'bg-ember', glowColor: 'shadow-ember-sm hover:shadow-ember-md',
 features: ['Predictive Analytics', 'Attrition Risk', 'Salary Forecast', 'Natural Language'],
 span: 'md',
 },
 {
 id: 'compliance', title: 'Compliance Engine', description: 'Automated regulatory governance.',
 icon: ShieldCheck, color: 'text-jade', dotColor: 'bg-jade', glowColor: '',
 features: ['Audit Logs', 'Policy Enforcement', 'GDPR/ISO Ready'],
 span: 'sm',
 },
 {
 id: 'marketplace', title: 'Marketplace', description: 'Jobs, partners & recruiter ecosystem.',
 icon: Store, color: 'text-aqua', dotColor: 'bg-aqua', glowColor: '',
 features: ['Public Job Board', 'Partner Network', 'Escrow Ready'],
 span: 'sm',
 },
 {
 id: 'erp', title: 'Finance & ERP', description: 'Unified financial operations command center.',
 icon: FileStack, color: 'text-gold', dotColor: 'bg-gold', glowColor: 'shadow-gold-sm hover:shadow-gold-md',
 features: ['Invoice Ledger', 'Expense Control', 'Receivables', 'GST Summary'],
 span: 'md',
 },
 {
 id: 'intelligence', title: 'Executive Intelligence', description: 'Board-level analytics and OKR visibility.',
 icon: BarChart3, color: 'text-ember', dotColor: 'bg-ember', glowColor: '',
 features: ['Revenue Forecasting', 'OKR Dashboard', 'ROI Analysis'],
 span: 'sm',
 },
 {
 id: 'security', title: 'Security Plane', description: 'Zero-Trust architecture with real-time threat mitigation.',
 icon: Cpu, color: 'text-aqua', dotColor: 'bg-aqua', glowColor: '',
 features: ['Behavioral Anomaly', 'Forensic Audit Lock', 'RBAC + SSO'],
 span: 'sm',
 },
];

function ProductCard({ product, index }: { product: Product; index: number }) {
 const spanClass =
 product.span === 'lg' ? 'md:col-span-2 md:row-span-2' :
 product.span === 'md' ? 'md:col-span-2' : '';

 return (
 <motion.article
 initial={{ opacity: 0, y: 24 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-60px' }}
 transition={{ delay: index * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
 className={`group glass-3d-panel p-6 flex flex-col gap-4
 transition-all duration-300 hover:bg-white/8 ${product.glowColor} ${spanClass}`}
 >
 <div className="flex items-start justify-between">
 <div className={`h-11 w-11 rounded-xl bg-navy/5 border border-white/8 flex items-center justify-center
 group-hover:scale-110 transition-transform duration-300`}>
 <product.icon className={`h-5 w-5 ${product.color}`} aria-hidden="true" />
 </div>
 <span className={`section-label ${product.color} opacity-60`}>{product.id.toUpperCase()}</span>
 </div>

 <div>
 <h3 className="text-lg font-black tracking-tight text-navy">{product.title}</h3>
 <p className="text-sm text-slate-500 mt-1 leading-relaxed">{product.description}</p>
 </div>

 <ul className="space-y-1.5 mt-auto" aria-label={`${product.title} features`}>
 {product.features.map((f) => (
 <li key={f} className="flex items-center gap-2 text-xs text-slate-500">
 <span className={`h-1 w-1 rounded-full ${product.dotColor}`} aria-hidden="true" />
 {f}
 </li>
 ))}
 </ul>
 </motion.article>
 );
}

export function EcosystemSection() {
 return (
 <section id="ecosystem" className="py-28" aria-labelledby="ecosystem-heading">
 <div className="container-brand">
 <div className="text-center mb-16">
 <p className="section-label text-gold mb-3">Product Ecosystem</p>
 <h2
 id="ecosystem-heading"
 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none text-navy"
 >
 Everything in One
 <br />
 <span className="text-gradient-gold">Sovereign Platform</span>
 </h2>
 <p className="mt-5 text-lg text-slate-500 max-w-2xl mx-auto">
 Nine fully integrated product domains — no stitching, no sprawl.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {PRODUCTS.map((p, i) => (
 <ProductCard key={p.id} product={p} index={i} />
 ))}
 </div>
 </div>
 </section>
 );
}
