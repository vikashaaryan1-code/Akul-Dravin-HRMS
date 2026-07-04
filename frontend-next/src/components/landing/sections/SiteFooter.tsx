'use client';

import React from 'react';
import Link from 'next/link';
import { Rocket, Twitter, Linkedin, Github, Globe } from 'lucide-react';

const FOOTER_LINKS = {
 Platform: [
 { label: 'HRMS Core', href: '#ecosystem' },
 { label: 'AI Copilot', href: '#ai-copilot' },
 { label: 'Payroll Suite', href: '#ecosystem' },
 { label: 'ATS & Recruitment', href: '#ecosystem' },
 { label: 'Finance & ERP', href: '#ecosystem' },
 ],
 Company: [
 { label: 'About', href: '/about' },
 { label: 'Careers', href: '/careers' },
 { label: 'Blog', href: '/blog' },
 { label: 'Press', href: '/press' },
 { label: 'Partners', href: '/partners' },
 ],
 Resources: [
 { label: 'Documentation', href: '/docs' },
 { label: 'API Reference', href: '/api' },
 { label: 'Status', href: '/status' },
 { label: 'Changelog', href: '/changelog' },
 { label: 'Security', href: '#security' },
 ],
 Legal: [
 { label: 'Privacy Policy', href: '/privacy' },
 { label: 'Terms of Service', href: '/terms' },
 { label: 'Cookie Policy', href: '/cookies' },
 { label: 'DPA', href: '/dpa' },
 { label: 'GDPR Center', href: '/gdpr' },
 ],
} as const;

const SOCIAL = [
 { icon: Twitter, label: 'Twitter / X', href: 'https://twitter.com' },
 { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
 { icon: Github, label: 'GitHub', href: 'https://github.com' },
 { icon: Globe, label: 'Website', href: '/' },
] as const;

export function SiteFooter() {
 return (
 <footer className="border-t border-navy/[0.05] bg-depth-1/30 pt-20 pb-10" aria-label="Site footer">
 <div className="container-brand">
 {/* Top row */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-16">
 {/* Brand */}
 <div className="col-span-2 md:col-span-1 lg:col-span-2">
 <Link href="#top" className="flex items-center gap-3 mb-5 group" aria-label="AKUL DRAVIN home">
 <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gold to-ember flex items-center justify-center shadow-gold-sm group-hover:shadow-gold-md transition-all">
 <Rocket className="h-4 w-4 text-void" aria-hidden="true" />
 </div>
 <div>
 <p className="text-sm font-black tracking-tighter text-white">AKUL DRAVIN</p>
 <p className="text-[9px] font-bold uppercase tracking-widest text-gold/50">
 Sovereign AI OS
 </p>
 </div>
 </Link>
 <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">
 The world&apos;s most comprehensive AI-native business operating system for modern enterprises.
 </p>
 <div className="flex gap-3 mt-6" aria-label="Social media links">
 {SOCIAL.map((s) => (
 <a
 key={s.label}
 href={s.href}
 target="_blank"
 rel="noopener noreferrer"
 aria-label={s.label}
 className="h-8 w-8 rounded-lg surface-base border-subtle flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5/8 transition-all duration-200"
 >
 <s.icon className="h-3.5 w-3.5" aria-hidden="true" />
 </a>
 ))}
 </div>
 </div>

 {/* Link columns */}
 {(Object.entries(FOOTER_LINKS) as [string, readonly { label: string; href: string }[]][]).map(
 ([group, links]) => (
 <nav key={group} aria-label={`${group} links`}>
 <p className="section-label text-slate-400 mb-5">{group}</p>
 <ul className="space-y-3">
 {links.map((link) => (
 <li key={link.label}>
 <Link
 href={link.href}
 className="text-xs text-slate-400 hover:text-white transition-colors duration-200"
 >
 {link.label}
 </Link>
 </li>
 ))}
 </ul>
 </nav>
 ),
 )}
 </div>

 {/* Trust badges */}
 <div className="flex flex-wrap gap-4 mb-10 border-t border-navy/5 pt-10">
 {['SOC 2 Type II', 'ISO 27001', 'GDPR Ready', 'Zero-Trust', 'AES-256'].map((badge) => (
 <span
 key={badge}
 className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/8 bg-white/5/[0.03] text-[10px] font-bold text-slate-400"
 >
 <span className="h-1 w-1 rounded-full bg-jade" aria-hidden="true" />
 {badge}
 </span>
 ))}
 </div>

 {/* Bottom row */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
 <p>© {new Date().getFullYear()} Pueri Ecosystem Pvt. Ltd. All rights reserved.</p>
 <p>AKUL DRAVIN — Sovereign AI Business Operating System</p>
 </div>
 </div>
 </footer>
 );
}
