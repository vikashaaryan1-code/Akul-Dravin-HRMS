import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hrms.akuldravin.com';

/**
 * DYNAMIC SITEMAP — generated at build time / ISR
 * All public platform routes included for Google indexing.
 * Pages ordered by priority for Googlebot crawl budget optimization.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // ── Priority 1.0 — Home ──────────────────────────────────────────────────
  const homeRoute: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
  ];

  // ── Priority 0.9 — Core Marketing Pages ─────────────────────────────────
  const marketingRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/about`,        lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/features`,     lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/pricing`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/a2z`,          lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/contact`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/faq`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/integrations`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/security`,     lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];

  // ── Priority 0.7 — Auth & Conversion ────────────────────────────────────
  const authRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/login`,    lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/signup`,   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // ── Priority 0.5 — Legal (indexed for trust signals) ────────────────────
  const legalRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/terms`,   lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ];

  // ── Priority 0.6 — Platform Module Pages ────────────────────────────────
  const platformModules = [
    // Core HRMS
    'dashboard', 'employees', 'payroll', 'attendance', 'leave',
    'performance', 'recruitment', 'documents', 'finance', 'analytics',
    // Extended modules
    'lms', 'gamification', 'crm', 'sales', 'tasks', 'helpdesk',
    'onboarding', 'offboarding', 'compliance', 'ai-hub', 'smart-platform',
    'marketplace', 'job-board', 'settings', 'my-workspace',
    // Specialized
    'surveys', 'timesheets', 'expense', 'automation', 'communications',
  ];

  const moduleRoutes: MetadataRoute.Sitemap = platformModules.map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    ...homeRoute,
    ...marketingRoutes,
    ...authRoutes,
    ...legalRoutes,
    ...moduleRoutes,
  ];
}
