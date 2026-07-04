'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { AkulDravinLogo } from '@/components/brand/AkulDravinLogo';

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Resources', href: '#resources' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export function StickyNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-display ${
        scrolled ? 'bg-[#0A1E3A]/80 backdrop-blur-xl border-b border-white/10 shadow-lg py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="#top" className="flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-aqua rounded-md">
           <AkulDravinLogo width={40} height={40} />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/80 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-aqua rounded-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue to-aqua text-white text-sm font-bold shadow-lg hover:shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-white/80 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-[#0A1E3A] border-b border-white/10 shadow-2xl flex flex-col p-6 md:hidden gap-6"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-white/80 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="px-6 py-3 text-center rounded-full bg-gradient-to-r from-blue to-aqua text-white text-base font-bold"
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
