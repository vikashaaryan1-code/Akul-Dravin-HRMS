import { type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * e2e/setup/global-teardown.ts
 * Cleanup after full E2E run.
 * - Removes the shared auth session file so the next run starts fresh.
 * - In CI, playwright-report is preserved by the CI artifact step instead.
 */
export default async function globalTeardown(_config: FullConfig) {
  const sessionPath = path.join(__dirname, '../.auth/session.json');
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
  }
}
