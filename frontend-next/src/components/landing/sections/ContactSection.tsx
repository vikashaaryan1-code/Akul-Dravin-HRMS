'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, CalendarDays, ArrowUpRight, Phone } from 'lucide-react';
import { LandingLeadHub } from '../LandingLeadHub';

const WHATSAPP_NUMBER = '919000000000';

export function ContactSection() {
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Hi, I would like to schedule a demo of AKUL DRAVIN Sovereign AI OS.'
  )}`;

  return (
    <section id="contact" className="py-28 bg-depth-1/50" aria-labelledby="contact-heading">
      <div className="container-brand">
        <div className="text-center mb-16">
          <p className="section-label text-gold mb-3">Get Started</p>
          <h2
            id="contact-heading"
            className="text-4xl lg:text-6xl font-black tracking-tighter leading-none text-white"
          >
            Book Your
            <br />
            <span className="text-gradient-gold">Enterprise Demo</span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 max-w-xl mx-auto">
            Talk to a senior solutions architect. Response within 1 business day.
          </p>
        </div>

        {/* Quick contact CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            id="contact-whatsapp-cta"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#25d366]/10 border border-[#25d366]/25 text-[#25d366] text-sm font-bold hover:bg-[#25d366]/20 transition-all duration-200"
            aria-label="Contact via WhatsApp"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp Us
          </a>
          <Link
            href="#contact"
            id="contact-schedule-cta"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl surface-raised border-subtle text-sm font-bold text-white hover:bg-white/8 transition-all duration-200"
          >
            <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" />
            Schedule Consultation
          </Link>
          <a
            href="tel:+919000000000"
            id="contact-phone-cta"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl surface-raised border-subtle text-sm font-bold text-white hover:bg-white/8 transition-all duration-200"
          >
            <Phone className="h-4 w-4 text-aqua" aria-hidden="true" />
            Call Enterprise Team
          </a>
        </motion.div>

        {/* Lead hub form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="surface-raised border-subtle rounded-3xl p-8 lg:p-12"
        >
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="section-label text-gold mb-2">Launch Consultation</p>
              <h3 className="text-2xl font-black text-white">Request an A2Z Platform Walkthrough</h3>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-jade/25 bg-jade/8 text-jade text-xs font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-jade animate-pulse-live" aria-hidden="true" />
              Response within 1 business day
            </div>
          </div>
          <LandingLeadHub />
        </motion.div>
      </div>
    </section>
  );
}
