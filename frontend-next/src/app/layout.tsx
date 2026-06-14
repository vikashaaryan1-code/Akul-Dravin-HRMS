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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const domain = headersList.get('x-tenant-domain') || 'localhost';

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
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
