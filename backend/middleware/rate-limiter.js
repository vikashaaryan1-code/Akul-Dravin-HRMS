/**
 * rate-limiter.js
 * Enterprise rate limiting middleware for the HRMS API.
 *
 * Strategy:
 *  - Uses an in-memory sliding window (Map-based).
 *  - In production, replace the store with Redis for multi-instance support.
 *  - Separate limits per endpoint group (auth is stricter than API).
 *
 * Usage:
 *   import { rateLimiter, authRateLimiter } from './middleware/rate-limiter.js';
 *   // General API:  router.use(rateLimiter)
 *   // Login/OTP:    router.post('/login', authRateLimiter, loginHandler)
 */

// ── In-memory sliding window store ────────────────────────────────────────────
const store = new Map(); // key → { count, resetAt }

function getKey(req, prefix = 'rl') {
  // Use X-Forwarded-For for reverse-proxy setups, fall back to socket IP
  const ip =
    (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  return `${prefix}:${ip}`;
}

function cleanExpired() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Creates a rate limiter middleware.
 *
 * @param {object} options
 * @param {number} options.windowMs   - Time window in milliseconds (default: 60s)
 * @param {number} options.max        - Max requests per window (default: 100)
 * @param {string} options.prefix     - Store key prefix (default: 'rl')
 * @param {string} options.message    - Error message (default: generic 429 message)
 */
function createRateLimiter({ windowMs = 60_000, max = 100, prefix = 'rl', message } = {}) {
  // Periodically clean expired entries to prevent memory leaks
  setInterval(cleanExpired, windowMs * 2);

  return function rateLimiterMiddleware(req, res, next) {
    const key = getKey(req, prefix);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      // New window
      entry = { count: 1, resetAt: now + windowMs };
      store.set(key, entry);
    } else {
      entry.count += 1;
    }

    // Set standard rate limit headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
    const remaining = Math.max(0, max - entry.count);
    const resetSec = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSec);
    res.setHeader('Retry-After', resetSec);

    if (entry.count > max) {
      return res.writeHead(429, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({
          success: false,
          error: message ?? 'Too many requests. Please wait before retrying.',
          retryAfter: resetSec,
          code: 'RATE_LIMIT_EXCEEDED',
        })
      );
    }

    next?.();
  };
}

// ── Pre-configured limiters ────────────────────────────────────────────────────

/**
 * General API rate limiter — 100 requests per minute per IP.
 * Apply to all routes: server.use(rateLimiter)
 */
export const rateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
  prefix: 'api',
  message: 'API rate limit exceeded. Maximum 100 requests per minute.',
});

/**
 * Auth rate limiter — 10 requests per 15 minutes per IP.
 * Apply only to login/register/OTP routes.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX ?? 10),
  prefix: 'auth',
  message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
});

/**
 * Contact form rate limiter — 5 requests per hour per IP.
 */
export const contactRateLimiter = createRateLimiter({
  windowMs: 60 * 60_000,
  max: 5,
  prefix: 'contact',
  message: 'Too many contact submissions. Please try again in an hour.',
});

/**
 * AI endpoint rate limiter — 30 requests per minute per IP.
 * LLM calls are expensive; tighter limit.
 */
export const aiRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  prefix: 'ai',
  message: 'AI request limit exceeded. Maximum 30 AI requests per minute.',
});

export { createRateLimiter };
