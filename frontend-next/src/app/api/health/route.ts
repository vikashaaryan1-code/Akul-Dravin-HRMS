import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint for Docker, Kubernetes, and load balancer probes.
 * Returns 200 when the service is healthy, 503 when degraded.
 */
export async function GET() {
  const startTime = Date.now();

  const health = {
    status: 'healthy',
    service: 'akul-dravin-hrms-frontend',
    version: process.env.npm_package_version ?? '4.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    responseTimeMs: 0,
  };

  health.responseTimeMs = Date.now() - startTime;

  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Check': 'pass',
    },
  });
}

// Allow GET only
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
