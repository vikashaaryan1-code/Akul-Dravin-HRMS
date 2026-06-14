import * as https from 'node:https';
import * as http from 'node:http';
import { URL } from 'node:url';

export interface DlqAlertPayload {
  type: 'DLQ_EVENT';
  jobId: string | undefined;
  queue: string;
  requestId: string;
  attemptsMade: number;
  maxAttempts: number | undefined;
  errorMessage: string;
  timestamp: string;
  remediation: string;
}

// ---------------------------------------------------------------------------
// Internal: single-shot HTTP/HTTPS POST
// ---------------------------------------------------------------------------
function postToWebhook(webhookUrl: string, payload: DlqAlertPayload): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(webhookUrl);
    } catch {
      reject(new Error(`ALERT_WEBHOOK_URL is not a valid URL: "${webhookUrl}"`));
      return;
    }

    const body = JSON.stringify(payload);
    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'akul-dravin-hrms/1.0 DLQAlert',
      },
    };

    const transport = parsedUrl.protocol === 'https:' ? https : http;

    const req = transport.request(options, (res) => {
      // Drain the response body to prevent socket hang
      res.resume();
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`Alert webhook responded with HTTP ${res.statusCode}`));
      }
    });

    req.on('error', (err) => reject(err));

    // Timeout: 5 seconds — alerting must not block the processor
    req.setTimeout(5000, () => {
      req.destroy(new Error('Alert webhook request timed out after 5s'));
    });

    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Exponential backoff delay helper (pure, testable)
// ---------------------------------------------------------------------------
function backoffDelay(attemptIndex: number): Promise<void> {
  // Attempt 0 → 0 ms (immediate), Attempt 1 → 2000 ms, Attempt 2 → 4000 ms …
  const ms = attemptIndex === 0 ? 0 : Math.pow(2, attemptIndex) * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fireAlertWebhookWithRetry — sends an HTTP/HTTPS POST to ALERT_WEBHOOK_URL
 * with up to `maxAttempts` tries using exponential backoff.
 *
 * Design decisions:
 * - Uses only built-in node:https / node:http — zero extra dependencies.
 * - Never throws: all failures are logged and swallowed so the BullMQ
 *   worker loop is never disrupted by alerting infrastructure problems.
 * - Retry schedule (default): 0 s → 2 s → 4 s (3 attempts total).
 * - Works with Slack incoming webhooks, PagerDuty Events API v2, or any
 *   custom alert receiver that accepts `Content-Type: application/json`.
 *
 * Environment:
 *   ALERT_WEBHOOK_URL — if not set, the function is a no-op.
 *
 * @param payload     The DLQ alert payload to POST.
 * @param maxAttempts Maximum delivery attempts (default: 3).
 * @param logger      Optional logger fn for retry / failure messages.
 */
export async function fireAlertWebhookWithRetry(
  payload: DlqAlertPayload,
  maxAttempts = 3,
  logger: (msg: string) => void = console.error,
): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    // Explicit no-op — not an error
    return;
  }

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await backoffDelay(attempt);
    try {
      await postToWebhook(webhookUrl, payload);
      return; // ✅ Delivery succeeded
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger(
        `[DLQAlert] Attempt ${attempt + 1}/${maxAttempts} failed for requestId=${payload.requestId}: ${lastError.message}`,
      );
    }
  }

  // All attempts exhausted — log terminal failure, never throw
  logger(
    JSON.stringify({
      event: 'ALERT_PERMANENTLY_FAILED',
      requestId: payload.requestId,
      jobId: payload.jobId,
      queue: payload.queue,
      attemptsExhausted: maxAttempts,
      lastError: lastError?.message,
      timestamp: new Date().toISOString(),
    }),
  );
}

/**
 * fireAlertWebhook — single-attempt fire-and-forget.
 *
 * @deprecated Prefer fireAlertWebhookWithRetry for production use.
 *             This wrapper is kept for backward-compat call sites.
 */
export function fireAlertWebhook(payload: DlqAlertPayload): Promise<void> {
  return fireAlertWebhookWithRetry(payload, 1);
}
