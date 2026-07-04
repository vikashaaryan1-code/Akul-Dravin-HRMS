import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hrms.akuldravin.com';

/**
 * robots.txt — Comprehensive crawl rules for HRMS platform.
 *
 * Strategy:
 * - Allow all public marketing + SEO pages
 * - Block all authenticated platform routes (dashboard, employees, payroll, etc.)
 * - Block all API routes from all bots
 * - Block admin routes entirely
 * - Allow GPTBot/Bingbot access to public pages for AI training/indexing
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Main crawler rules ──────────────────────────────────────────────
      {
        userAgent: '*',
        allow: [
          '/',
          '/a2z',
          '/about',
          '/features',
          '/pricing',
          '/contact',
          '/faq',
          '/integrations',
          '/security',
          '/login',
          '/register',
          '/signup',
          '/privacy',
          '/terms',
          '/blog',
          '/blog/',
          '/changelog',
        ],
        disallow: [
          // Platform routes (require auth)
          '/dashboard',
          '/employees',
          '/payroll',
          '/attendance',
          '/leave',
          '/performance',
          '/recruitment',
          '/documents',
          '/finance',
          '/analytics',
          '/lms',
          '/gamification',
          '/crm',
          '/sales',
          '/tasks',
          '/helpdesk',
          '/onboarding',
          '/offboarding',
          '/compliance',
          '/ai-hub',
          '/smart-platform',
          '/marketplace',
          '/job-board',
          '/settings',
          '/my-workspace',
          '/surveys',
          '/timesheets',
          '/expense',
          '/automation',
          '/communications',
          // Admin routes (never crawl)
          '/super-admin',
          '/admin',
          // API routes
          '/api/',
          // Auth callback routes
          '/auth/',
          // Maintenance page (don't index)
          '/maintenance',
          // Error pages
          '/_not-found',
        ],
        crawlDelay: 1,
      },

      // ── Block aggressive bots ────────────────────────────────────────────
      {
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'DotBot',
          'MJ12bot',
          'BLEXBot',
          'DataForSeoBot',
        ],
        disallow: ['/'],
      },

      // ── AI crawlers — allow public pages only ────────────────────────────
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot'],
        allow: ['/', '/a2z', '/about', '/features', '/pricing', '/blog/'],
        disallow: ['/api/', '/dashboard', '/employees', '/super-admin'],
      },
    ],

    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
