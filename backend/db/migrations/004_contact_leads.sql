-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 004: Contact Leads — Move from contact-leads.json to PostgreSQL
-- 
-- Replaces the in-memory / JSON file store with a proper persisted table.
-- Adds:
--   - contact_leads table with all fields from the JSON schema
--   - Enum for company size and status
--   - GIN index for full-text search
--   - Webhook delivery audit log
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Enum: Company size ────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE contact_company_size AS ENUM (
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Enum: Lead status ─────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE contact_lead_status AS ENUM (
    'new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'spam'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Table: contact_leads ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_leads (
  id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact info
  name            VARCHAR(200)          NOT NULL,
  email           VARCHAR(320)          NOT NULL,
  phone           VARCHAR(30),
  company         VARCHAR(200),
  company_size    contact_company_size,
  job_title       VARCHAR(150),

  -- Lead details
  message         TEXT                  NOT NULL,
  product_interest VARCHAR(150),
  source          VARCHAR(100)          DEFAULT 'website',
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(100),
  referrer_url    VARCHAR(2048),

  -- CRM fields
  status          contact_lead_status   NOT NULL DEFAULT 'new',
  assigned_to     UUID,                 -- FK to users.id (soft reference)
  notes           TEXT,
  lead_score      SMALLINT              DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),

  -- GDPR / consent
  gdpr_consent    BOOLEAN               NOT NULL DEFAULT FALSE,
  ip_address      INET,
  user_agent      TEXT,

  -- Webhook
  webhook_sent    BOOLEAN               NOT NULL DEFAULT FALSE,
  webhook_sent_at TIMESTAMPTZ,
  webhook_status  SMALLINT,             -- HTTP status code of last webhook attempt

  -- Timestamps
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  contacted_at    TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ
);

-- ── Table: contact_lead_webhook_log ───────────────────────────────────────────
-- Audit trail for all webhook delivery attempts
CREATE TABLE IF NOT EXISTS contact_lead_webhook_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID        NOT NULL REFERENCES contact_leads(id) ON DELETE CASCADE,
  attempt_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_code     SMALLINT,
  response_body   TEXT,
  error_message   TEXT,
  duration_ms     INTEGER
);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contact_leads_updated_at ON contact_leads;
CREATE TRIGGER contact_leads_updated_at
  BEFORE UPDATE ON contact_leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Primary lookup patterns
CREATE INDEX IF NOT EXISTS idx_contact_leads_email
  ON contact_leads (email);

CREATE INDEX IF NOT EXISTS idx_contact_leads_status
  ON contact_leads (status);

CREATE INDEX IF NOT EXISTS idx_contact_leads_created_at
  ON contact_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_leads_source
  ON contact_leads (source);

-- CRM assignment
CREATE INDEX IF NOT EXISTS idx_contact_leads_assigned_to
  ON contact_leads (assigned_to) WHERE assigned_to IS NOT NULL;

-- Webhook processing: find unsent leads
CREATE INDEX IF NOT EXISTS idx_contact_leads_webhook_unsent
  ON contact_leads (webhook_sent, created_at)
  WHERE webhook_sent = FALSE;

-- Full-text search on name, email, company, message
CREATE INDEX IF NOT EXISTS idx_contact_leads_fts
  ON contact_leads USING GIN (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(company, '') || ' ' ||
      coalesce(message, '')
    )
  );

-- Webhook log lookup
CREATE INDEX IF NOT EXISTS idx_webhook_log_lead_id
  ON contact_lead_webhook_log (lead_id, attempt_at DESC);

-- ── Comments ──────────────────────────────────────────────────────────────────
COMMENT ON TABLE contact_leads IS 'Website contact form submissions and sales leads. Migrated from contact-leads.json.';
COMMENT ON TABLE contact_lead_webhook_log IS 'Audit log of all webhook delivery attempts for contact leads.';
COMMENT ON COLUMN contact_leads.lead_score IS '0–100 score computed from company size, message quality, and engagement.';
COMMENT ON COLUMN contact_leads.gdpr_consent IS 'True only if user explicitly checked the consent checkbox on the form.';

COMMIT;
