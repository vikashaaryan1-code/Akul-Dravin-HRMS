import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hrms.akuldravin.com';

/**
 * DYNAMIC SITEMAP — generated at build time / ISR
 * All public platform routes included for Google indexing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/a2z`,                lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/login`,              lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/register`,           lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/my-workspace`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
  ];


  const platformModules = [
    'dashboard', 'employees', 'payroll', 'attendance', 'leave',
    'performance', 'recruitment', 'documents', 'finance', 'analytics',
    'lms', 'gamification', 'crm', 'sales', 'tasks', 'helpdesk',
    'onboarding', 'offboarding', 'compliance', 'ai-hub', 'smart-platform',
    'marketplace', 'job-board', 'settings',
  ];

  const moduleRoutes: MetadataRoute.Sitemap = platformModules.map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...moduleRoutes];
}
