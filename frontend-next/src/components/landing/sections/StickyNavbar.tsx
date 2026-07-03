'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Menu, X, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

const NAV_LINKS = [
 { label: 'Platform', href: '#ecosystem' },
 { label: 'Workflow', href: '#workflow' },
 { label: 'Pricing', href: '#pricing' },
 { label: 'Security', href: '#security' },
 { label: 'FAQ', href: '#faq' },
] as const;

export function StickyNavbar() {
 const user = useAuthStore((s) => s.user);
 const [scrolled, setScrolled] = useState(false);
 const [mobileOpen, setMobileOpen] = useState(false);

 useEffect(() => {
 const onScroll = () => setScrolled(window.scrollY > 20);
 window.addEventListener('scroll', onScroll, { passive: true });
 return () => window.removeEventListener('scroll', onScroll);
 }, []);

 const closeMobile = () => setMobileOpen(false);

 return (
 <>
 <motion.header
 initial={{ y: -80, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
 className={`fixed top-0 z-nav w-full transition-all duration-400 ${
 scrolled
 ? 'border-b border-navy/5 bg-void/80 backdrop-blur-xl shadow-glass'
 : 'bg-transparent'
 }`}
 role="banner"
 >
 <div className="container-brand flex items-center justify-between py-4">
 {/* Logo */}
 <Link href="#top" className="flex items-center gap-3 group" aria-label="AKUL DRAVIN Home">
 <div className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-gold to-ember shadow-gold-sm group-hover:shadow-gold-md transition-all duration-300">
 <Rocket className="h-5 w-5 text-navy" aria-hidden="true" />
 </div>
 <div className="flex flex-col leading-none">
 <span className="text-sm font-black tracking-tighter text-navy">AKUL DRAVIN</span>
 <span className="text-[9px] font-bold uppercase tracking-widest text-gold-dim mt-0.5">
 Sovereign AI OS
 </span>
 </div>
 </Link>

 {/* Desktop Nav */}
 <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
 {NAV_LINKS.map((link) => (
 <Link
 key={link.label}
 href={link.href}
 className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-navy transition-colors duration-200"
 >
 {link.label}
 </Link>
 ))}
 </nav>

 {/* Desktop CTAs */}
 <div className="hidden lg:flex items-center gap-4">
 <Link
 href={user ? '/dashboard' : '/login'}
 className="text-xs font-bold text-slate-500 hover:text-navy transition-colors"
 >
 {user ? 'Dashboard' : 'Sign In'}
 </Link>
 <Link
 href="#contact"
 className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-gold to-ember text-white text-xs font-black uppercase tracking-wide hover:shadow-gold-md hover:scale-105 active:scale-95 transition-all duration-200"
 >
 Demo <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
 </Link>
 </div>

 {/* Mobile Hamburger */}
 <button
 id="mobile-nav-toggle"
 onClick={() => setMobileOpen((o) => !o)}
 className="lg:hidden p-2 rounded-lg surface-base hover:surface-raised transition-all"
 aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
 aria-expanded={mobileOpen}
 >
 {mobileOpen ? (
 <X className="h-5 w-5 text-navy" aria-hidden="true" />
 ) : (
 <Menu className="h-5 w-5 text-navy" aria-hidden="true" />
 )}
 </button>
 </div>
 </motion.header>

 {/* Mobile Drawer */}
 <AnimatePresence>
 {mobileOpen && (
 <motion.div
 initial={{ opacity: 0, y: -12 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -12 }}
 transition={{ duration: 0.25 }}
 className="fixed inset-x-0 top-[72px] z-[90] mx-4 rounded-2xl border border-navy/10 bg-depth-1/95 backdrop-blur-2xl shadow-2xl lg:hidden"
 role="dialog"
 aria-label="Mobile navigation"
 >
 <nav className="flex flex-col p-6 gap-4">
 {NAV_LINKS.map((link) => (
 <Link
 key={link.label}
 href={link.href}
 onClick={closeMobile}
 className="text-sm font-semibold text-slate-600 hover:text-navy py-2 border-b border-navy/5 transition-colors"
 >
 {link.label}
 </Link>
 ))}
 <div className="pt-4 flex flex-col gap-3">
 <Link
 href={user ? '/dashboard' : '/login'}
 onClick={closeMobile}
 className="text-center text-sm font-bold text-slate-600 hover:text-navy py-2.5 rounded-xl border border-navy/10 transition-colors"
 >
 {user ? 'Dashboard' : 'Sign In'}
 </Link>
 <Link
 href="#contact"
 onClick={closeMobile}
 className="text-center text-sm font-black py-3 rounded-xl bg-gradient-to-r from-gold to-ember text-white hover:opacity-90 transition-opacity"
 >
 Demo
 </Link>
 </div>
 </nav>
 </motion.div>
 )}
 </AnimatePresence>
 </>
 );
}
