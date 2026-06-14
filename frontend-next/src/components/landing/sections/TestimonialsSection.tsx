'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type { PublicLandingPayload } from '@/lib/public-site';

type Props = { testimonials: PublicLandingPayload['testimonials'] };

export function TestimonialsSection({ testimonials }: Props) {
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <section id="testimonials" className="py-28" aria-labelledby="testimonials-heading">
      <div className="container-brand">
        <div className="text-center mb-16">
          <p className="section-label text-aqua mb-3">Client Stories</p>
          <h2
            id="testimonials-heading"
            className="text-4xl lg:text-6xl font-black tracking-tighter leading-none text-white"
          >
            Trusted by Leaders
          </h2>
        </div>

        {/* Glass Carousel */}
        <div className="relative max-w-4xl mx-auto" role="region" aria-label="Testimonials carousel" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="surface-raised border-subtle rounded-3xl p-10 lg:p-16"
            >
              <Quote className="h-10 w-10 text-gold/30 mb-8" aria-hidden="true" />
              <blockquote>
                <p className="text-xl lg:text-2xl font-semibold text-white leading-relaxed">
                  &ldquo;{testimonials[current].quote}&rdquo;
                </p>
                <footer className="mt-8 flex items-center gap-4">
                  <div
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-gold to-ember flex items-center justify-center text-void font-black text-lg"
                    aria-hidden="true"
                  >
                    {testimonials[current].name[0]}
                  </div>
                  <div>
                    <cite className="not-italic font-black text-white text-sm">
                      {testimonials[current].name}
                    </cite>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {testimonials[current].title} · {testimonials[current].company}
                    </p>
                  </div>
                </footer>
              </blockquote>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2" role="tablist" aria-label="Testimonial navigation dots">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Testimonial ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 bg-gold' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="h-10 w-10 rounded-full surface-raised border-subtle flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={next}
                aria-label="Next testimonial"
                className="h-10 w-10 rounded-full surface-raised border-subtle flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Additional cards grid */}
        {total > 1 && (
          <div className="grid md:grid-cols-3 gap-5 mt-12 opacity-50 hover:opacity-80 transition-opacity duration-500">
            {testimonials.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setCurrent(i)}
                className={`text-left surface-base border-subtle rounded-2xl p-5 transition-all duration-300 hover:bg-white/5 ${
                  i === current ? 'border-gold/30' : ''
                }`}
                aria-label={`Jump to ${t.name} testimonial`}
              >
                <p className="text-xs text-slate-400 line-clamp-2">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-xs font-bold text-white mt-3">{t.name}</p>
                <p className="text-[10px] text-slate-500">{t.company}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
