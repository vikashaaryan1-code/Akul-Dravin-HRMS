import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '../components/ui/ToastContainer';

const inter = Inter({
 variable: '--font-inter',
 subsets: ['latin'],
 weight: ['400', '500', '600', '700', '800', '900'],
 display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
 variable: '--font-mono',
 subsets: ['latin'],
 weight: ['400', '500', '700'],
 display: 'swap',
});

export const metadata: Metadata = {
 metadataBase: new URL('https://hrms.akuldravin.com'),

 title: {
 default: 'Akul Dravin — Enterprise HRMS, ERP & CRM Platform',
 template: '%s | Akul Dravin',
 },
 description:
 'Akul Dravin is a unified enterprise orchestration platform combining HRMS, ERP, CRM, AI workflow automation, and recruitment. Multi-tenant, Kubernetes-ready, OpenTelemetry-instrumented.',

 keywords: [
 'enterprise HRMS', 'ERP platform', 'CRM software', 'HR management system',
 'payroll automation', 'workflow engine', 'AI workforce platform',
 'multi-tenant SaaS', 'attendance management', 'employee management',
 'BullMQ', 'NestJS', 'OpenTelemetry', 'pgvector',
 ],

 authors: [{ name: 'Akul Dravin Engineering', url: 'https://akuldravin.com' }],
 creator: 'Akul Dravin',
 publisher: 'Akul Dravin Technologies Pvt Ltd',

 robots: {
 index: true,
 follow: true,
 googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
 },

 openGraph: {
 type: 'website',
 locale: 'en_IN',
 url: 'https://hrms.akuldravin.com',
 siteName: 'Akul Dravin Enterprise Platform',
 title: 'Akul Dravin — Enterprise HRMS, ERP & CRM Platform',
 description:
 'A unified enterprise orchestration platform combining HRMS, ERP, CRM, AI automation, and recruitment. Built for global multi-tenant deployment.',
 images: [
 {
 url: '/images/og-cover.png',
 width: 1200,
 height: 630,
 alt: 'Akul Dravin Enterprise Platform',
 },
 ],
 },

 twitter: {
 card: 'summary_large_image',
 title: 'Akul Dravin — Enterprise HRMS, ERP & CRM Platform',
 description:
 'Unified enterprise platform: HRMS · ERP · CRM · AI Automation · Workflow Engine · Recruitment.',
 images: ['/images/og-cover.png'],
 creator: '@akuldravin',
 },

 icons: {
 icon: '/favicon.ico',
 apple: '/apple-touch-icon.png',
 },

 manifest: '/site.webmanifest',
};

import { AuthProvider } from '@/components/auth/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { BrandingProvider } from '@/providers/BrandingProvider';
import { headers } from 'next/headers';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Akul Dravin Technologies',
  url: 'https://hrms.akuldravin.com',
  logo: 'https://hrms.akuldravin.com/images/logo.png',
  sameAs: [
    'https://twitter.com/akuldravin',
    'https://linkedin.com/company/akuldravin',
    'https://github.com/akuldravin',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: 'support@akuldravin.com',
    availableLanguage: ['English', 'Hindi'],
  },
};

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Akul Dravin HRMS AI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://hrms.akuldravin.com',
  description:
    'AI-first enterprise HRMS platform combining workforce management, payroll automation, recruitment, compliance, and AI analytics in a single unified platform.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    description: 'Free trial available. Enterprise pricing on request.',
  },
  featureList: [
    'Employee Management',
    'AI-Powered Payroll',
    'Attendance & Leave Management',
    'ATS & Recruitment',
    'Performance OKRs',
    'AI Copilot & Analytics',
    'Compliance Engine',
    'Multi-tenant Architecture',
  ],
  screenshot: 'https://hrms.akuldravin.com/images/og-cover.png',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const domain = headersList.get('x-tenant-domain') || 'localhost';

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <head>
        {/* Schema.org Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Schema.org Structured Data — SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
      </head>
      <body className="antialiased font-sans">
        <BrandingProvider domain={domain}>
          <AuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AuthProvider>
          <ToastContainer />
        </BrandingProvider>
      </body>
    </html>
  );
}
