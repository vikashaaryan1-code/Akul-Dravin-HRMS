/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import PerformanceOptimizer from '@/components/PerformanceOptimizer';
import './globals.css';

const headingFont = Space_Grotesk({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
});

const bodyFont = Plus_Jakarta_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AKUL DRAVIN OFFICE PORTAL & HRMS PLATFORM',
  description:
    'Enterprise office portal and HRMS platform with role-based permissions, employee monitoring, attendance automation, location tracking, performance intelligence, and workflow orchestration.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  themeColor: '#1a73e8',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="http://localhost:4200" />
      </head>
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <PerformanceOptimizer />
        {children}
      </body>
    </html>
  );
}
