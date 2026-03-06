/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'AKUL DRAVIN OFFICE PORTAL & HRMS PLATFORM | Enterprise Workforce Automation',
  description:
    'Enterprise office management platform for attendance, employee monitoring, permission control, location tracking, payroll, performance analytics, and workflow automation.',
  keywords: [
    'AKUL DRAVIN',
    'Office Portal',
    'HRMS',
    'employee monitoring',
    'RBAC',
    'location tracking',
    'workday analytics',
    'enterprise SaaS',
  ],
};

export default function HomePage() {
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
    </main>
  );
}
