import { test, expect } from '@playwright/test';

/**
 * Tenant Isolation E2E Tests
 *
 * Verifies that one tenant cannot access another tenant's data.
 * Uses two separate auth contexts: tenant A and tenant B.
 *
 * Requires:
 *   E2E_TENANT_A_EMAIL / E2E_TENANT_A_PASSWORD
 *   E2E_TENANT_B_EMAIL / E2E_TENANT_B_PASSWORD
 *   E2E_API_URL
 *
 * Skipped if tenant B credentials not provided (single-tenant dev setup).
 */

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:4001';

test.describe('Tenant Isolation', () => {
  test.skip(!process.env.E2E_TENANT_B_EMAIL, 'Tenant B credentials not configured — skipping isolation tests');

  test('tenant A token cannot access tenant B employees endpoint', async ({ request }) => {
    // Get tenant A token
    const loginA = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: {
        email: process.env.E2E_TENANT_A_EMAIL,
        password: process.env.E2E_TENANT_A_PASSWORD,
      },
    });
    expect(loginA.ok()).toBeTruthy();
    const { accessToken } = await loginA.json();

    // Get tenant B's ID header
    const tenantBId = process.env.E2E_TENANT_B_ID ?? '';

    // Try to query with tenant B's header but tenant A's token
    const res = await request.get(`${API_URL}/api/v1/employees`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantBId,
      },
    });

    // Should be 403 Forbidden — tenant context mismatch
    expect([403, 401]).toContain(res.status());
  });

  test('tenant A activity feed contains only tenant A events', async ({ request }) => {
    const loginA = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: {
        email: process.env.E2E_TENANT_A_EMAIL,
        password: process.env.E2E_TENANT_A_PASSWORD,
      },
    });
    expect(loginA.ok()).toBeTruthy();
    const { accessToken, user } = await loginA.json();

    const res = await request.get(`${API_URL}/api/v1/activity`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status() === 200) {
      const body = await res.json();
      const events = body.events ?? [];
      // All events should belong to tenant A
      const foreignEvents = events.filter(
        (e: { tenantId?: string }) => e.tenantId && e.tenantId !== user?.tenantId
      );
      expect(foreignEvents).toHaveLength(0);
    }
  });
});

test.describe('API Security', () => {
  test('unauthenticated API requests are rejected', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/employees`);
    expect([401, 403]).toContain(res.status());
  });

  test('invalid JWT is rejected', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/employees`, {
      headers: { Authorization: 'Bearer fake.jwt.token' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('health endpoint is publicly accessible', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/health`);
    expect(res.status()).toBe(200);
  });

  test('search endpoint requires authentication', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/search?q=test`);
    expect([401, 403]).toContain(res.status());
  });
});
