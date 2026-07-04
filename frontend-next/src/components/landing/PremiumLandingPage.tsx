'use client';

import React from 'react';
import type { PublicLandingPayload } from '@/lib/public-site';
import { StickyNavbar } from './sections/StickyNavbar';
import { HeroSection } from './sections/HeroSection';
import { TrustTicker } from './sections/TrustTicker';
import { MetricsGrid } from './sections/MetricsGrid';
import { EcosystemSection } from './sections/EcosystemSection';
import { WorkflowTimeline } from './sections/WorkflowTimeline';
import { PricingSection } from './sections/PricingSection';
import { AiCopilotSection } from './sections/AiCopilotSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FaqSection } from './sections/FaqSection';
import { SecuritySection } from './sections/SecuritySection';
import { ContactSection } from './sections/ContactSection';
import { SiteFooter } from './sections/SiteFooter';

type Props = { data: PublicLandingPayload };

/**
 * PremiumLandingPage — AKUL DRAVIN Sovereign AI Business Operating System
 * Phase 2: Production-ready enterprise SaaS landing page (CyberGlass 2.0)
 *
 * Sections:
 * 1. StickyNavbar — glassmorphism, mobile menu, smooth scroll CTAs
 * 2. HeroSection — AI-native positioning, animated gradients, dual CTAs
 * 3. TrustTicker — animated brand strip, compliance badges, infra signals
 * 4. MetricsGrid — animated counters, bento cards (data.metrics)
 * 5. EcosystemSection — 9-product bento grid, hover glow, glass cards
 * 6. WorkflowTimeline — AI orchestration flow (data.operatingModel)
 * 7. PricingSection — monthly/yearly toggle, featured plan (data.plans)
 * 8. AiCopilotSection — chat UI, predictive analytics, digital twin preview
 * 9. TestimonialsSection — glass carousel (data.testimonials)
 * 10. FaqSection — accessible accordion (data.faq)
 * 11. SecuritySection — GDPR, ISO, SOC2, Zero Trust, encryption, AI governance
 * 12. ContactSection — enterprise form, WhatsApp CTA, consultation CTA
 * 13. SiteFooter — links, social, legal, trust indicators
 */
export function PremiumLandingPage({ data }: Props) {
 return (
 <div className="min-h-screen bg-navy text-white font-sans selection:bg-gold/20 selection:text-gold antialiased">
 {/* Skip-to-content for a11y */}
 <a
 href="#top"
 className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-gold focus:text-void focus:text-sm focus:font-bold"
 >
 Skip to main content
 </a>

 {/* 1. Navigation */}
 <StickyNavbar />

 <main id="main-content">
 {/* 2. Hero */}
 <HeroSection />

 {/* 3. Trust Ticker */}
 <TrustTicker />

 {/* 4. Metrics Grid */}
 <MetricsGrid metrics={data.metrics} />

 {/* 5. Product Ecosystem */}
 <EcosystemSection />

 {/* 6. Workflow Timeline */}
 <WorkflowTimeline steps={data.operatingModel} />

 {/* 7. Pricing */}
 <PricingSection plans={data.plans} />

 {/* 8. AI Copilot Showcase */}
 <AiCopilotSection />

 {/* 9. Testimonials */}
 <TestimonialsSection testimonials={data.testimonials} />

 {/* 10. FAQ */}
 <FaqSection faq={data.faq} />

 {/* 11. Security & Compliance */}
 <SecuritySection />

 {/* 12. Contact / Demo Booking */}
 <ContactSection />
 </main>

 {/* 13. Footer */}
 <SiteFooter />
 </div>
 );
}
