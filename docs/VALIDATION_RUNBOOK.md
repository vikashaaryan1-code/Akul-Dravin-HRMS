# Production Validation Runbook — Akul Dravin HRMS

> **Run this checklist before marking the system as production-live.**
> Complete every step. Mark ✅ when passed. Escalate any ❌ before deploy.

---

## Pre-Deploy Checklist

### 1. Environment Variables
Verify all vars are set in Railway **for both staging and production**:

```bash
# Required — system fails to start if missing
JWT_SECRET             # openssl rand -hex 64
DB_HOST                # or DATABASE_URL (Railway Postgres plugin injects this)

# Payment
STRIPE_SECRET          # sk_live_... (sk_test_... for staging)
STRIPE_WEBHOOK_SECRET  # whsec_... from Stripe Dashboard → Webhooks

# Email
AWS_SES_REGION         # ap-south-1
AWS_SES_FROM_EMAIL     # noreply@akuldravin.com (must be verified in SES)
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# CORS
ALLOWED_ORIGINS        # https://app.akuldravin.com (comma-separated)
APP_URL                # https://app.akuldravin.com

# Redis (Railway Redis plugin injects REDIS_URL)
REDIS_URL
```

---

## Phase 1 — Deployment Validation

### 1.1 Health Check

```bash
# Must return HTTP 200 with status: "ok" or "degraded"
curl -s https://api.akuldravin.com/api/v1/health | jq .
```

Expected:
```json
{
  "status": "ok",
  "checks": { "database": "ok", "redis": "ok" }
}
```

✅ / ❌

### 1.2 CORS Headers

```bash
curl -I -H "Origin: https://app.akuldravin.com" \
     https://api.akuldravin.com/api/v1/health
```

Must include: `Access-Control-Allow-Origin: https://app.akuldravin.com`

✅ / ❌

---

## Phase 2 — CI/CD Validation

### 2.1 Push to staging

```bash
git push origin develop:staging
```

1. GitHub Actions → CI gate runs (TypeScript + tests + Docker build)
2. On success → Railway deploys backend then frontend
3. Health check step passes
4. Check Railway Dashboard → Deployments → both services `Active`

✅ / ❌

### 2.2 Push to main (production)

```bash
git push origin main
```

Same as 2.1 + post-deploy smoke test runs.

✅ / ❌

---

## Phase 3 — Stripe Payments Validation

### 3.1 Install Stripe CLI

```bash
# Windows: winget install Stripe.StripeCLI
stripe login
stripe listen --forward-to https://api.akuldravin.com/api/v1/billing/stripe/webhook
```

### 3.2 Trigger checkout.session.completed

```bash
stripe trigger checkout.session.completed
```

Expected DB state:
```sql
SELECT status FROM subscriptions WHERE company_id = '<your_test_company_id>';
-- Expected: 'active'

SELECT event_type FROM payment_events ORDER BY created_at DESC LIMIT 1;
-- Expected: 'checkout.session.completed'
```

✅ / ❌

### 3.3 Trigger invoice.payment_failed

```bash
stripe trigger invoice.payment_failed
```

Expected DB state:
```sql
SELECT status FROM subscriptions WHERE company_id = '<your_test_company_id>';
-- Expected: 'past_due'

SELECT status FROM invoices ORDER BY created_at DESC LIMIT 1;
-- Expected: 'failed'
```

✅ / ❌

### 3.4 Idempotency Test

Send the same Stripe event ID twice:
```bash
# Repeat the trigger — second call must not create a duplicate payment_events row
stripe trigger invoice.payment_failed
```

```sql
SELECT COUNT(*) FROM payment_events WHERE stripe_event_id = '<evt_test_xxx>';
-- Expected: 1 (not 2)
```

✅ / ❌

---

## Phase 4 — Email Notifications Validation

### 4.1 Welcome Email (on register)

1. Register a new company at `/register`
2. Check the email inbox for the registered address
3. Verify subject: `"Welcome to Akul Dravin HRMS — Your account is ready"`

✅ / ❌

### 4.2 Leave Status Email

1. Employee submits a leave request
2. Admin approves it
3. Employee receives email with leave details

Check backend logs:
```
EMAIL_SENT to=employee@company.com subject="Leave Request Approved"
```

✅ / ❌

### 4.3 Payroll Completion Email

1. Admin runs payroll for a batch
2. Employee receives payslip notification email

Check backend logs:
```
EMAIL_SENT to=employee@company.com subject="Your Payslip for"
```

✅ / ❌

### 4.4 Email Retry Test

1. Temporarily set `AWS_SES_REGION=""` (blank)
2. Trigger a registration
3. Check logs for: `EMAIL_SENDER_NOT_CONFIGURED: AWS SES env vars missing`
4. Restore `AWS_SES_REGION`

✅ / ❌

---

## Phase 5 — Security Hardening Validation

### 5.1 Rate Limiting — Auth

```bash
# 6 rapid login attempts — 6th must return 429
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code} " \
    -X POST https://api.akuldravin.com/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"wrong"}'
done
# Output: 401 401 401 401 401 429
```

✅ / ❌

### 5.2 Stripe Webhook — Invalid Signature

```bash
curl -X POST https://api.akuldravin.com/api/v1/billing/stripe/webhook \
     -H "Content-Type: application/json" \
     -H "stripe-signature: invalid_signature" \
     -d '{"id":"evt_test","type":"invoice.paid","data":{"object":{}}}'
# Must return: 401
```

✅ / ❌

### 5.3 Security Headers

```bash
curl -sI https://api.akuldravin.com/api/v1/health | grep -i "x-\|content-security"
```

Must include:
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Content-Security-Policy` (production only)

✅ / ❌

### 5.4 JWT Refresh

```bash
# Get a token, wait for near-expiry, then refresh
curl -X POST https://api.akuldravin.com/api/v1/auth/refresh \
     -H "Authorization: Bearer <your_token>"
# Must return: { accessToken: "...", expiresIn: 43200 }
```

✅ / ❌

---

## Phase 6 — Core User Flow (E2E)

### 6.1 Full HRMS Workflow

```
1. Register company → receive welcome email ✅
2. Login → 2-step MFA flow works ✅
3. Add employee → appears in employee list ✅
4. Employee submits leave → manager approves ✅
5. Leave approval email delivered ✅
6. Run payroll batch → payslip generated (PDF) ✅
7. Employee downloads payslip from /payroll ✅
8. Payroll email delivered ✅
```

### 6.2 Billing Flow

```
1. Signup → Stripe Checkout → payment succeeds ✅
2. subscription.status = 'active' in DB ✅
3. Dashboard accessible ✅
4. Stripe triggers invoice.payment_failed ✅
5. subscription.status = 'past_due' ✅
6. Within grace period → still accessible ✅
7. After grace period → 402 returned ✅
```

### 6.3 Frontend Error Handling

```
1. Kill backend server locally
2. Open any module page
3. Error toast appears (not a blank screen) ✅
4. Fallback data is shown ✅
5. Restart backend → page refreshes with live data ✅
```

---

## Phase 7 — Resilience Tests

### 7.1 Redis Failure

```bash
# In Railway: pause the Redis service
# Expected: App continues to run (queues fail gracefully)
# Check logs for: REDIS_CLIENT connect ECONNREFUSED
# Expected: no crash, no 500 on /health
curl https://api.akuldravin.com/api/v1/health
# Expected: { "status": "degraded", "checks": { "database": "ok", "redis": "down" } }
```

✅ / ❌

### 7.2 DB Failure

```bash
# In Railway: pause the Postgres service
curl https://api.akuldravin.com/api/v1/health
# Expected: { "status": "down", "checks": { "database": "down" } }
# HTTP 200 still returned (health endpoint must not crash)
```

✅ / ❌

### 7.3 Stripe Webhook Replay Attack

```bash
# Send a Stripe webhook with timestamp > 5 minutes old
# stripe-signature must fail: "timestamp too old"
# Expected: 401
```

✅ / ❌

---

## Go/No-Go Criteria

| Check | Status |
|---|---|
| All health checks pass | |
| CI/CD deploys on push to main | |
| Stripe checkout activates subscription | |
| invoice.payment_failed marks past_due | |
| Welcome email delivered | |
| Leave approval email delivered | |
| JWT refresh working | |
| Rate limiting on auth endpoints | |
| Webhook signature verification rejects invalid sig | |
| Full HRMS workflow (6.1) completes | |
| Redis failure → graceful degraded state | |

**System is LIVE when all rows show ✅.**
