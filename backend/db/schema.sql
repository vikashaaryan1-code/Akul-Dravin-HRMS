CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email CITEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL,
  name TEXT NOT NULL,
  email CITEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  ctc_monthly NUMERIC(12, 2) NOT NULL CHECK (ctc_monthly > 0),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, employee_code),
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS ats_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ats_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES ats_jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email CITEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('screening', 'interview', 'offered', 'joined', 'rejected')),
  ai_score INTEGER NOT NULL CHECK (ai_score >= 0 AND ai_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^\\d{4}-\\d{2}$'),
  status TEXT NOT NULL CHECK (status IN ('processed', 'draft', 'failed')),
  employee_count INTEGER NOT NULL,
  total_gross NUMERIC(14, 2) NOT NULL,
  total_deductions NUMERIC(14, 2) NOT NULL,
  total_net NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, month)
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  gross NUMERIC(12, 2) NOT NULL,
  pf NUMERIC(12, 2) NOT NULL,
  tds NUMERIC(12, 2) NOT NULL,
  deductions NUMERIC(12, 2) NOT NULL,
  net NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees (tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON ats_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidates_tenant ON ats_candidates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant ON payroll_runs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_run ON payroll_items (run_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY employees_tenant_isolation ON employees
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY jobs_tenant_isolation ON ats_jobs
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY candidates_tenant_isolation ON ats_candidates
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY payroll_runs_tenant_isolation ON payroll_runs
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY payroll_items_tenant_isolation ON payroll_items
  USING (tenant_id::text = current_setting('app.tenant_id', true));