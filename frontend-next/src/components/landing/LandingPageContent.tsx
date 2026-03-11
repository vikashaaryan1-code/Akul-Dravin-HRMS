'use client';

import { AutomationSection } from '@/components/landing/AutomationSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { DashboardPreviewSection } from '@/components/landing/DashboardPreviewSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HeroSection } from '@/components/landing/HeroSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { MarketplaceSection } from '@/components/landing/MarketplaceSection';
import { PlatformStatsSection } from '@/components/landing/PlatformStatsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ChatbotIcon } from '@/components/chatbot/ChatbotIcon';

export function LandingPageContent() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#F2AA3B1f,_transparent_45%),radial-gradient(circle_at_bottom_left,_#0F8B8D1a,_transparent_55%)]">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <AutomationSection />
      <DashboardPreviewSection />
      <PricingSection />
      <PlatformStatsSection />
      <MarketplaceSection />
      <TestimonialsSection />
      <CtaSection />
      <LandingFooter />
      <ChatbotIcon />
    </main>
  );
}
