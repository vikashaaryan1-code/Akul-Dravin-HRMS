import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware — Route Protection
 *
 * Protects all platform routes by checking for an access token stored in
 * localStorage (via Zustand persist). Since middleware runs on the Edge,
 * we read the token from a cookie that the client sets alongside localStorage
 * for SSR/middleware compatibility.
 *
 * Cookie name: akul-auth-token
 * Set by: useTokenRefresh hook on every token issue/refresh
 *
 * Protected prefixes:  /dashboard, /employees, /payroll, /attendance,
 *                      /analytics, /crm, /finance, /settings, /admin, etc.
 * Public routes:       /, /login, /signup, /forgot-password,
 *                      /reset-password, /oauth-callback, /features,
 *                      /pricing, /about, /contact, /api/auth/*
 */

const PUBLIC_PREFIXES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/oauth-callback',
  '/features',
  '/pricing',
  '/about',
  '/contact',
  '/a2z',
  '/_next',
  '/favicon',
  '/images',
  '/api/auth',        // Next.js auth API routes (if added later)
  '/robots.txt',
  '/sitemap.xml',
  '/site.webmanifest',
  '/apple-touch-icon',
];

const SUPER_ADMIN_PREFIXES = [
  '/super-admin',
  '/platform-admin',
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some((prefix) =>
    prefix !== '/' && pathname.startsWith(prefix),
  );
}

function isSuperAdminRoute(pathname: string): boolean {
  return SUPER_ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Read the auth cookie (set by the client after login/OAuth)
  const token = request.cookies.get('akul-auth-token')?.value;

  if (!token) {
    // No token → redirect to login with the original URL as ?next= param
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Basic JWT structure validation (Edge can't verify signature — just check format)
  // Full verification happens on every API call via JwtAuthGuard on the backend.
  const parts = token.split('.');
  if (parts.length !== 3) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('akul-auth-token');
    return response;
  }

  // Check token expiry from the payload (no signature verification — Edge limitation)
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8'),
    ) as { exp?: number; role?: string };

    // Token expired — redirect to login
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('akul-auth-token');
      return response;
    }

    // Super-admin routes — require super_admin role
    if (isSuperAdminRoute(pathname)) {
      const role = (payload.role ?? '').toLowerCase();
      const isSuperAdmin = role.includes('super') || role.includes('platform-admin');
      if (!isSuperAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  } catch {
    // Malformed payload — redirect to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('akul-auth-token');
    return response;
  }

  // Add White Label routing headers
  const hostname = request.headers.get('host') || '';
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-domain', hostname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, images/
     * - Public-facing API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
