import type { MetadataRoute } from 'next';

/**
 * robots.txt — prevents bots from crawling authenticated routes.
 */
export default function robots(): MetadataRoute.Robots {
 const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hrms.akuldravin.com';
 return {
 rules: [
 {
 userAgent: '*',
 allow: ['/', '/a2z', '/login', '/register'],
 disallow: [
 '/dashboard', '/employees', '/payroll', '/attendance', '/leave',
 '/performance', '/finance', '/settings', '/super-admin', '/api/',
 ],
 },
 ],
 sitemap: `${base}/sitemap.xml`,
 };
}
