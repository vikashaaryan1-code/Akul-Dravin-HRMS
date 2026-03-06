
-- AKUL DRAVIN HRMS & ERP PLATFORM v39.0
-- PostgreSQL Enterprise Schema (multi-tenant, partitioned, analytics-ready)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS platform;
SET search_path TO platform, public;

-- =====================================================
-- Helpers
-- =====================================================

CREATE OR REPLACE FUNCTION platform.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION platform.create_monthly_partitions(
  p_schema_name text,
  p_table_name text,
  p_start_month date,
  p_month_count integer,
  p_value_type text DEFAULT 'date'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_from date;
  v_to date;
  v_partition_name text;
  i integer;
BEGIN
  IF p_month_count < 1 THEN
    RAISE EXCEPTION 'p_month_count must be >= 1';
  END IF;

  FOR i IN 0..(p_month_count - 1) LOOP
    v_from := (date_trunc('month', p_start_month) + make_interval(months => i))::date;
    v_to := (v_from + INTERVAL '1 month')::date;
    v_partition_name := format('%s_%s', p_table_name, to_char(v_from, 'YYYYMM'));

    IF p_value_type = 'timestamptz' THEN
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I.%I PARTITION OF %I.%I FOR VALUES FROM (%L) TO (%L);',
        p_schema_name,
        v_partition_name,
        p_schema_name,
        p_table_name,
        v_from::text || ' 00:00:00+00',
        v_to::text || ' 00:00:00+00'
      );
    ELSE
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I.%I PARTITION OF %I.%I FOR VALUES FROM (%L) TO (%L);',
        p_schema_name,
        v_partition_name,
        p_schema_name,
        p_table_name,
        v_from,
        v_to
      );
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- Tenant + Region + White Label
-- =====================================================

CREATE TABLE IF NOT EXISTS platform.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key varchar(80) NOT NULL UNIQUE,
  legal_name varchar(220) NOT NULL,
  display_name varchar(220) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  default_region varchar(20) NOT NULL,
  default_timezone varchar(80) NOT NULL,
  data_residency_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.tenant_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  region_code varchar(20) NOT NULL,
  data_plane varchar(60) NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, region_code)
);

CREATE TABLE IF NOT EXISTS platform.white_label_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code varchar(60) NOT NULL UNIQUE,
  legal_name varchar(200) NOT NULL,
  display_name varchar(200) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  allowed_domains jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.partner_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES platform.white_label_partners(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  pricing_override jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, tenant_id)
);

-- =====================================================
-- Identity + IAM
-- =====================================================

CREATE TABLE IF NOT EXISTS platform.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  role_key varchar(80) NOT NULL,
  role_name varchar(120) NOT NULL,
  level smallint NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, role_key)
);

CREATE TABLE IF NOT EXISTS platform.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key varchar(140) NOT NULL UNIQUE,
  module varchar(80) NOT NULL,
  action varchar(40) NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS platform.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL REFERENCES platform.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, role_id, permission_id),
  FOREIGN KEY (tenant_id, role_id) REFERENCES platform.roles(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  email citext NOT NULL,
  password_hash varchar(255) NOT NULL,
  full_name varchar(160) NOT NULL,
  phone varchar(30),
  is_mfa_enabled boolean NOT NULL DEFAULT false,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS platform.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  scope_type varchar(30) NOT NULL CHECK (scope_type IN ('tenant', 'company', 'branch', 'department')),
  scope_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, role_id, scope_type, scope_id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES platform.users(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, role_id) REFERENCES platform.roles(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  refresh_token_hash varchar(255) NOT NULL,
  device_fingerprint varchar(255),
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, user_id) REFERENCES platform.users(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  key_name varchar(120) NOT NULL,
  key_hash varchar(255) NOT NULL,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- Organization + HRMS Core
-- =====================================================

CREATE TABLE IF NOT EXISTS platform.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_code varchar(50) NOT NULL,
  legal_name varchar(220) NOT NULL,
  display_name varchar(220) NOT NULL,
  registration_number varchar(120),
  country varchar(80) NOT NULL,
  timezone varchar(80) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, company_code),
  UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  branch_code varchar(50) NOT NULL,
  branch_name varchar(180) NOT NULL,
  city varchar(120) NOT NULL,
  state varchar(120),
  country varchar(80) NOT NULL,
  timezone varchar(80) NOT NULL,
  geofence jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, company_id, branch_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  branch_id uuid,
  parent_department_id uuid,
  department_code varchar(50) NOT NULL,
  department_name varchar(180) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, company_id, department_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES platform.branches(tenant_id, id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id, parent_department_id) REFERENCES platform.departments(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  designation_code varchar(50) NOT NULL,
  designation_name varchar(160) NOT NULL,
  level_rank smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, company_id, designation_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  branch_id uuid,
  department_id uuid,
  designation_id uuid,
  manager_id uuid,
  user_id uuid,
  employee_code varchar(60) NOT NULL,
  first_name varchar(80) NOT NULL,
  last_name varchar(80),
  work_email citext NOT NULL,
  personal_email citext,
  phone varchar(30),
  date_of_birth date,
  gender varchar(20),
  employment_type varchar(30) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'probation', 'notice', 'exited')),
  join_date date NOT NULL,
  exit_date date,
  ctc_monthly numeric(14,2),
  pii_encrypted jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, company_id, employee_code),
  UNIQUE (tenant_id, work_email),
  UNIQUE (tenant_id, id),
  CHECK (exit_date IS NULL OR exit_date >= join_date),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES platform.branches(tenant_id, id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id, department_id) REFERENCES platform.departments(tenant_id, id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id, designation_id) REFERENCES platform.designations(tenant_id, id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id, manager_id) REFERENCES platform.employees(tenant_id, id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id, user_id) REFERENCES platform.users(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  document_type varchar(60) NOT NULL,
  file_url text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, employee_id) REFERENCES platform.employees(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.employee_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  event_type varchar(40) NOT NULL,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_time timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, employee_id) REFERENCES platform.employees(tenant_id, id) ON DELETE CASCADE
);
-- =====================================================
-- Attendance + Leave + Payroll
-- =====================================================

CREATE TABLE IF NOT EXISTS platform.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  shift_code varchar(50) NOT NULL,
  shift_name varchar(120) NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  grace_minutes smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, company_id, shift_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  shift_id uuid,
  attendance_date date NOT NULL,
  check_in_at timestamptz,
  check_out_at timestamptz,
  source varchar(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'gps', 'biometric', 'face', 'api')),
  status varchar(20) NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'holiday', 'week_off')),
  latitude numeric(9,6),
  longitude numeric(9,6),
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (attendance_date, id),
  UNIQUE (tenant_id, employee_id, attendance_date),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, employee_id) REFERENCES platform.employees(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, shift_id) REFERENCES platform.shifts(tenant_id, id) ON DELETE SET NULL,
  CHECK (check_out_at IS NULL OR check_in_at IS NULL OR check_out_at >= check_in_at)
) PARTITION BY RANGE (attendance_date);

CREATE TABLE IF NOT EXISTS platform.attendance_records_default
PARTITION OF platform.attendance_records DEFAULT;

CREATE TABLE IF NOT EXISTS platform.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  leave_code varchar(30) NOT NULL,
  leave_name varchar(120) NOT NULL,
  carry_forward_limit numeric(8,2),
  encashable boolean NOT NULL DEFAULT false,
  is_paid boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, company_id, leave_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.leave_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  policy_name varchar(120) NOT NULL,
  rules jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, company_id, policy_name),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  leave_type_id uuid NOT NULL,
  balance_year int NOT NULL,
  opening_balance numeric(8,2) NOT NULL DEFAULT 0,
  earned numeric(8,2) NOT NULL DEFAULT 0,
  consumed numeric(8,2) NOT NULL DEFAULT 0,
  closing_balance numeric(8,2) NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, employee_id, leave_type_id, balance_year),
  FOREIGN KEY (tenant_id, employee_id) REFERENCES platform.employees(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, leave_type_id) REFERENCES platform.leave_types(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  leave_type_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric(6,2) NOT NULL,
  reason text,
  approval_state varchar(20) NOT NULL DEFAULT 'pending' CHECK (approval_state IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  FOREIGN KEY (tenant_id, employee_id) REFERENCES platform.employees(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, leave_type_id) REFERENCES platform.leave_types(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, approved_by) REFERENCES platform.employees(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.payroll_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  cycle_code varchar(50) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  payout_date date,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'locked', 'paid')),
  UNIQUE (tenant_id, company_id, cycle_code),
  UNIQUE (tenant_id, id),
  CHECK (end_date >= start_date),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.salary_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  component_code varchar(50) NOT NULL,
  component_name varchar(120) NOT NULL,
  component_type varchar(20) NOT NULL CHECK (component_type IN ('earning', 'deduction', 'employer_contribution', 'tax')),
  formula jsonb,
  is_taxable boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, company_id, component_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.employee_salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  salary_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, employee_id) REFERENCES platform.employees(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  payroll_cycle_id uuid NOT NULL,
  run_number int NOT NULL,
  run_status varchar(20) NOT NULL DEFAULT 'queued' CHECK (run_status IN ('queued', 'running', 'completed', 'failed')),
  summary jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  UNIQUE (tenant_id, payroll_cycle_id, run_number),
  FOREIGN KEY (tenant_id, payroll_cycle_id) REFERENCES platform.payroll_cycles(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.payroll_run_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  payroll_run_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  gross_amount numeric(14,2) NOT NULL,
  deduction_amount numeric(14,2) NOT NULL,
  net_amount numeric(14,2) NOT NULL,
  breakdown jsonb NOT NULL,
  UNIQUE (tenant_id, payroll_run_id, employee_id),
  FOREIGN KEY (tenant_id, payroll_run_id) REFERENCES platform.payroll_runs(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, employee_id) REFERENCES platform.employees(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  payroll_run_item_id uuid NOT NULL,
  payslip_number varchar(80) NOT NULL,
  file_url text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, payslip_number),
  FOREIGN KEY (tenant_id, payroll_run_item_id) REFERENCES platform.payroll_run_items(tenant_id, id) ON DELETE CASCADE
);

-- =====================================================
-- Recruitment ATS + Marketplace
-- =====================================================

CREATE TABLE IF NOT EXISTS platform.job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  recruiter_id uuid,
  job_code varchar(60) NOT NULL,
  title varchar(180) NOT NULL,
  description text NOT NULL,
  location jsonb,
  employment_type varchar(30) NOT NULL,
  min_experience numeric(4,1),
  max_experience numeric(4,1),
  salary_min numeric(14,2),
  salary_max numeric(14,2),
  currency char(3) NOT NULL DEFAULT 'INR',
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
  application_deadline date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, company_id, job_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.job_post_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  job_post_id uuid NOT NULL,
  skill_name varchar(120) NOT NULL,
  weight numeric(5,2) NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, job_post_id, skill_name),
  FOREIGN KEY (tenant_id, job_post_id) REFERENCES platform.job_posts(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  source_type varchar(20) NOT NULL CHECK (source_type IN ('marketplace', 'direct', 'referral', 'agency')),
  full_name varchar(180) NOT NULL,
  email citext,
  phone varchar(30),
  location jsonb,
  summary text,
  expected_salary numeric(14,2),
  currency char(3),
  resume_url text,
  profile_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.candidate_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL,
  skill_name varchar(120) NOT NULL,
  proficiency smallint CHECK (proficiency BETWEEN 1 AND 10),
  years_experience numeric(4,1),
  UNIQUE (tenant_id, candidate_id, skill_name),
  FOREIGN KEY (tenant_id, candidate_id) REFERENCES platform.candidates(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  job_post_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  recruiter_id uuid,
  stage varchar(40) NOT NULL DEFAULT 'applied',
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rejected', 'withdrawn', 'hired')),
  ai_match_score numeric(5,2),
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, job_post_id, candidate_id),
  FOREIGN KEY (tenant_id, job_post_id) REFERENCES platform.job_posts(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, candidate_id) REFERENCES platform.candidates(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  application_id uuid NOT NULL,
  interview_round varchar(50) NOT NULL,
  interview_type varchar(30) NOT NULL CHECK (interview_type IN ('phone', 'video', 'onsite', 'ai-video')),
  scheduled_at timestamptz,
  status varchar(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  panel_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, application_id) REFERENCES platform.applications(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.interview_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  interview_id uuid NOT NULL,
  reviewer_id uuid,
  score numeric(5,2),
  recommendation varchar(20) CHECK (recommendation IN ('strong_hire', 'hire', 'hold', 'reject')),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, interview_id, reviewer_id),
  FOREIGN KEY (tenant_id, interview_id) REFERENCES platform.interviews(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, reviewer_id) REFERENCES platform.users(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  application_id uuid NOT NULL,
  offer_ctc numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  joining_date date,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, application_id) REFERENCES platform.applications(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.hires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  application_id uuid NOT NULL UNIQUE,
  employee_id uuid,
  hired_at timestamptz NOT NULL DEFAULT now(),
  onboarding_status varchar(30) NOT NULL DEFAULT 'initiated',
  FOREIGN KEY (tenant_id, application_id) REFERENCES platform.applications(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, employee_id) REFERENCES platform.employees(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  recruiter_type varchar(30) NOT NULL CHECK (recruiter_type IN ('internal', 'agency', 'freelance', 'global_partner', 'ai_bot')),
  company_id uuid,
  agency_name varchar(180),
  full_name varchar(180) NOT NULL,
  email citext,
  phone varchar(30),
  commission_rate numeric(5,2) NOT NULL DEFAULT 15,
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.recruiter_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL,
  job_post_id uuid NOT NULL,
  assignment_status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, recruiter_id, job_post_id),
  FOREIGN KEY (tenant_id, recruiter_id) REFERENCES platform.recruiters(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, job_post_id) REFERENCES platform.job_posts(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL,
  hire_id uuid NOT NULL,
  placement_value numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, recruiter_id, hire_id),
  FOREIGN KEY (tenant_id, recruiter_id) REFERENCES platform.recruiters(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, hire_id) REFERENCES platform.hires(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  placement_id uuid NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  commission_amount numeric(14,2) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, placement_id) REFERENCES platform.placements(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  payout_status varchar(20) NOT NULL DEFAULT 'queued' CHECK (payout_status IN ('queued', 'processing', 'paid', 'failed')),
  reference_id varchar(120),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, recruiter_id) REFERENCES platform.recruiters(tenant_id, id) ON DELETE CASCADE
);
-- =====================================================
-- ERP Core (Finance, Procurement, Inventory, Sales, Projects, Assets)
-- =====================================================

CREATE TABLE IF NOT EXISTS platform.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  center_code varchar(50) NOT NULL,
  center_name varchar(180) NOT NULL,
  UNIQUE (tenant_id, company_id, center_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  account_code varchar(50) NOT NULL,
  account_name varchar(180) NOT NULL,
  account_type varchar(40) NOT NULL,
  parent_account_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, company_id, account_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, parent_account_id) REFERENCES platform.chart_of_accounts(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  journal_number varchar(80) NOT NULL,
  journal_date date NOT NULL,
  reference_type varchar(50),
  reference_id uuid,
  narration text,
  posted_by uuid,
  posted_at timestamptz,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  UNIQUE (tenant_id, company_id, journal_number),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, posted_by) REFERENCES platform.users(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  journal_entry_id uuid NOT NULL,
  account_id uuid NOT NULL,
  cost_center_id uuid,
  debit_amount numeric(14,2) NOT NULL DEFAULT 0,
  credit_amount numeric(14,2) NOT NULL DEFAULT 0,
  description text,
  CHECK ((debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0)),
  FOREIGN KEY (tenant_id, journal_entry_id) REFERENCES platform.journal_entries(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, account_id) REFERENCES platform.chart_of_accounts(tenant_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, cost_center_id) REFERENCES platform.cost_centers(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  vendor_code varchar(50) NOT NULL,
  vendor_name varchar(180) NOT NULL,
  email citext,
  phone varchar(30),
  tax_id varchar(80),
  status varchar(20) NOT NULL DEFAULT 'active',
  UNIQUE (tenant_id, company_id, vendor_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  po_number varchar(80) NOT NULL,
  po_date date NOT NULL,
  currency char(3) NOT NULL,
  subtotal numeric(14,2) NOT NULL,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'issued', 'received', 'closed', 'cancelled')),
  UNIQUE (tenant_id, company_id, po_number),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, vendor_id) REFERENCES platform.vendors(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS platform.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL,
  item_name varchar(180) NOT NULL,
  quantity numeric(12,3) NOT NULL,
  unit_price numeric(14,4) NOT NULL,
  line_amount numeric(14,2) NOT NULL,
  FOREIGN KEY (tenant_id, purchase_order_id) REFERENCES platform.purchase_orders(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  warehouse_code varchar(50) NOT NULL,
  warehouse_name varchar(180) NOT NULL,
  location jsonb,
  UNIQUE (tenant_id, company_id, warehouse_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  item_code varchar(60) NOT NULL,
  item_name varchar(180) NOT NULL,
  item_type varchar(30) NOT NULL,
  unit_of_measure varchar(20) NOT NULL,
  reorder_level numeric(12,3),
  tracking_payload jsonb,
  UNIQUE (tenant_id, company_id, item_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  movement_type varchar(20) NOT NULL CHECK (movement_type IN ('inbound', 'outbound', 'transfer', 'adjustment')),
  quantity numeric(12,3) NOT NULL,
  unit_cost numeric(14,4),
  reference_type varchar(40),
  reference_id uuid,
  moved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (moved_at, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, inventory_item_id) REFERENCES platform.inventory_items(tenant_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, warehouse_id) REFERENCES platform.warehouses(tenant_id, id) ON DELETE RESTRICT
) PARTITION BY RANGE (moved_at);

CREATE TABLE IF NOT EXISTS platform.stock_movements_default
PARTITION OF platform.stock_movements DEFAULT;

CREATE TABLE IF NOT EXISTS platform.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  customer_code varchar(60) NOT NULL,
  customer_name varchar(180) NOT NULL,
  email citext,
  phone varchar(30),
  status varchar(20) NOT NULL DEFAULT 'active',
  UNIQUE (tenant_id, company_id, customer_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  order_number varchar(80) NOT NULL,
  order_date date NOT NULL,
  currency char(3) NOT NULL,
  subtotal numeric(14,2) NOT NULL,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'fulfilled', 'invoiced', 'closed', 'cancelled')),
  UNIQUE (tenant_id, company_id, order_number),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, customer_id) REFERENCES platform.customers(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS platform.sales_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  sales_order_id uuid NOT NULL,
  inventory_item_id uuid,
  item_name varchar(180) NOT NULL,
  quantity numeric(12,3) NOT NULL,
  unit_price numeric(14,4) NOT NULL,
  line_amount numeric(14,2) NOT NULL,
  FOREIGN KEY (tenant_id, sales_order_id) REFERENCES platform.sales_orders(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, inventory_item_id) REFERENCES platform.inventory_items(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  project_code varchar(60) NOT NULL,
  project_name varchar(220) NOT NULL,
  customer_id uuid,
  start_date date,
  end_date date,
  budget_amount numeric(14,2),
  status varchar(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'on_hold', 'closed', 'cancelled')),
  UNIQUE (tenant_id, company_id, project_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, customer_id) REFERENCES platform.customers(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.project_timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  work_date date NOT NULL,
  hours_logged numeric(5,2) NOT NULL,
  task_note text,
  approval_state varchar(20) NOT NULL DEFAULT 'pending',
  UNIQUE (tenant_id, project_id, employee_id, work_date),
  FOREIGN KEY (tenant_id, project_id) REFERENCES platform.projects(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, employee_id) REFERENCES platform.employees(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  asset_code varchar(60) NOT NULL,
  asset_name varchar(180) NOT NULL,
  asset_category varchar(60),
  purchase_date date,
  purchase_cost numeric(14,2),
  useful_life_months int,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'retired')),
  UNIQUE (tenant_id, company_id, asset_code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, company_id) REFERENCES platform.companies(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.asset_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL,
  entry_date date NOT NULL,
  entry_type varchar(30) NOT NULL,
  amount numeric(14,2) NOT NULL,
  payload jsonb,
  FOREIGN KEY (tenant_id, asset_id) REFERENCES platform.assets(tenant_id, id) ON DELETE CASCADE
);

-- =====================================================
-- Subscription + Billing
-- =====================================================

CREATE TABLE IF NOT EXISTS platform.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code varchar(60) NOT NULL UNIQUE,
  plan_name varchar(160) NOT NULL,
  category varchar(40) NOT NULL,
  billing_cycle varchar(20) NOT NULL,
  currency char(3) NOT NULL,
  price_amount numeric(14,2) NOT NULL,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES platform.plans(id) ON DELETE RESTRICT,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  status varchar(20) NOT NULL CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  seats_limit int,
  job_posts_limit int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL,
  invoice_number varchar(80) NOT NULL,
  currency char(3) NOT NULL,
  amount_subtotal numeric(14,2) NOT NULL,
  amount_tax numeric(14,2) NOT NULL DEFAULT 0,
  amount_total numeric(14,2) NOT NULL,
  due_date date,
  invoice_status varchar(20) NOT NULL CHECK (invoice_status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number),
  FOREIGN KEY (tenant_id, subscription_id) REFERENCES platform.subscriptions(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL,
  payment_provider varchar(40) NOT NULL,
  provider_reference varchar(120),
  amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  payment_status varchar(20) NOT NULL CHECK (payment_status IN ('initiated', 'succeeded', 'failed', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, invoice_id) REFERENCES platform.invoices(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.usage_meter_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  metric_key varchar(80) NOT NULL,
  metric_value numeric(14,4) NOT NULL,
  dimension_payload jsonb,
  event_time timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_time, id)
) PARTITION BY RANGE (event_time);

CREATE TABLE IF NOT EXISTS platform.usage_meter_events_default
PARTITION OF platform.usage_meter_events DEFAULT;
-- =====================================================
-- AI Platform
-- =====================================================

CREATE TABLE IF NOT EXISTS platform.ml_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  model_key varchar(100) NOT NULL,
  model_name varchar(180) NOT NULL,
  model_domain varchar(60) NOT NULL,
  model_type varchar(60) NOT NULL,
  is_global boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), model_key)
);

CREATE TABLE IF NOT EXISTS platform.ml_model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  model_id uuid NOT NULL REFERENCES platform.ml_models(id) ON DELETE CASCADE,
  version_label varchar(60) NOT NULL,
  artifact_uri text NOT NULL,
  metrics jsonb NOT NULL,
  training_data_window jsonb,
  drift_threshold jsonb,
  status varchar(20) NOT NULL CHECK (status IN ('staging', 'active', 'retired', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (model_id, version_label)
);

CREATE TABLE IF NOT EXISTS platform.feature_store_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  entity_type varchar(40) NOT NULL,
  entity_id uuid NOT NULL,
  features jsonb NOT NULL,
  captured_at timestamptz NOT NULL,
  PRIMARY KEY (captured_at, id)
) PARTITION BY RANGE (captured_at);

CREATE TABLE IF NOT EXISTS platform.feature_store_snapshots_default
PARTITION OF platform.feature_store_snapshots DEFAULT;

CREATE TABLE IF NOT EXISTS platform.ai_inference_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  model_version_id uuid NOT NULL REFERENCES platform.ml_model_versions(id) ON DELETE CASCADE,
  request_id varchar(120),
  inference_type varchar(60) NOT NULL,
  input_payload jsonb,
  output_payload jsonb,
  confidence numeric(6,4),
  latency_ms int,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS platform.ai_inference_logs_default
PARTITION OF platform.ai_inference_logs DEFAULT;

CREATE TABLE IF NOT EXISTS platform.ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  recommendation_type varchar(60) NOT NULL,
  entity_type varchar(40) NOT NULL,
  entity_id uuid NOT NULL,
  score numeric(6,4),
  explanation jsonb,
  human_override_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  channel varchar(30) NOT NULL,
  language_code varchar(10) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  FOREIGN KEY (tenant_id, user_id) REFERENCES platform.users(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  chat_session_id uuid NOT NULL,
  sender_type varchar(20) NOT NULL CHECK (sender_type IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (chat_session_id) REFERENCES platform.chat_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.emotion_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  interview_id uuid,
  media_reference text,
  emotion_distribution jsonb NOT NULL,
  risk_flags jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.voice_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  transcript text,
  intent varchar(80),
  sentiment_score numeric(6,4),
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, user_id) REFERENCES platform.users(tenant_id, id) ON DELETE SET NULL
);

-- =====================================================
-- Analytics + Metaverse + Audit
-- =====================================================

CREATE TABLE IF NOT EXISTS platform.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  event_time timestamptz NOT NULL,
  event_name varchar(120) NOT NULL,
  module varchar(60) NOT NULL,
  actor_id uuid,
  trace_id varchar(64),
  payload jsonb NOT NULL,
  PRIMARY KEY (event_time, id)
) PARTITION BY RANGE (event_time);

CREATE TABLE IF NOT EXISTS platform.analytics_events_default
PARTITION OF platform.analytics_events DEFAULT;

CREATE TABLE IF NOT EXISTS platform.kpi_daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  kpi_key varchar(80) NOT NULL,
  kpi_value numeric(18,4) NOT NULL,
  dimension_payload jsonb,
  UNIQUE (tenant_id, snapshot_date, kpi_key)
);

CREATE TABLE IF NOT EXISTS platform.virtual_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  office_code varchar(60) NOT NULL,
  office_name varchar(180) NOT NULL,
  office_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, office_code)
);

CREATE TABLE IF NOT EXISTS platform.virtual_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  office_id uuid NOT NULL,
  room_code varchar(60) NOT NULL,
  room_name varchar(160) NOT NULL,
  capacity int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, office_id, room_code),
  FOREIGN KEY (tenant_id, office_id) REFERENCES platform.virtual_offices(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.virtual_presence_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  event_time timestamptz NOT NULL,
  user_id uuid,
  office_id uuid,
  room_id uuid,
  presence_status varchar(20) NOT NULL,
  payload jsonb,
  PRIMARY KEY (event_time, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES platform.users(tenant_id, id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id, office_id) REFERENCES platform.virtual_offices(tenant_id, id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id, room_id) REFERENCES platform.virtual_rooms(tenant_id, id) ON DELETE SET NULL
) PARTITION BY RANGE (event_time);

CREATE TABLE IF NOT EXISTS platform.virtual_presence_events_default
PARTITION OF platform.virtual_presence_events DEFAULT;

CREATE TABLE IF NOT EXISTS platform.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  user_id uuid,
  channel varchar(20) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push', 'in_app', 'webhook')),
  template_key varchar(80),
  recipient varchar(255),
  payload jsonb NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'delivered', 'read')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  FOREIGN KEY (tenant_id, user_id) REFERENCES platform.users(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  endpoint_name varchar(120) NOT NULL,
  target_url text NOT NULL,
  secret_hash varchar(255) NOT NULL,
  event_filters jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  webhook_id uuid NOT NULL,
  event_id varchar(120) NOT NULL,
  status_code int,
  attempt_count int NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, webhook_id) REFERENCES platform.webhooks(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
  logged_at timestamptz NOT NULL,
  actor_id uuid,
  module varchar(60) NOT NULL,
  action varchar(80) NOT NULL,
  entity_type varchar(60),
  entity_id uuid,
  ip_address inet,
  user_agent text,
  trace_id varchar(64),
  before_state jsonb,
  after_state jsonb,
  PRIMARY KEY (logged_at, id)
) PARTITION BY RANGE (logged_at);

CREATE TABLE IF NOT EXISTS platform.audit_logs_default
PARTITION OF platform.audit_logs DEFAULT;

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_status ON platform.users (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_user ON platform.sessions (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_company ON platform.employees (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_department ON platform.employees (tenant_id, department_id);
CREATE INDEX IF NOT EXISTS idx_employee_lifecycle_tenant_time ON platform.employee_lifecycle_events (tenant_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_status ON platform.leave_requests (tenant_id, approval_state, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant_status ON platform.payroll_runs (tenant_id, run_status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_posts_tenant_status ON platform.job_posts (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_tenant_stage ON platform.applications (tenant_id, stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_tenant_schedule ON platform.interviews (tenant_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_status ON platform.commissions (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_status ON platform.purchase_orders (tenant_id, status, po_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_orders_tenant_status ON platform.sales_orders (tenant_id, status, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_status ON platform.projects (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON platform.invoices (tenant_id, invoice_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status ON platform.payments (tenant_id, payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_tenant_entity ON platform.ai_recommendations (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time ON platform.chat_messages (chat_session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_status ON platform.notifications (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_payload_gin ON platform.analytics_events USING gin (payload);
CREATE INDEX IF NOT EXISTS idx_audit_logs_trace ON platform.audit_logs (trace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_after_state_gin ON platform.audit_logs USING gin (after_state);
CREATE INDEX IF NOT EXISTS idx_ai_inference_logs_output_gin ON platform.ai_inference_logs USING gin (output_payload);

-- =====================================================
-- Partition bootstrap (current month + 18 months)
-- =====================================================

SELECT platform.create_monthly_partitions('platform', 'attendance_records', CURRENT_DATE, 18, 'date');
SELECT platform.create_monthly_partitions('platform', 'stock_movements', CURRENT_DATE, 18, 'timestamptz');
SELECT platform.create_monthly_partitions('platform', 'usage_meter_events', CURRENT_DATE, 18, 'timestamptz');
SELECT platform.create_monthly_partitions('platform', 'feature_store_snapshots', CURRENT_DATE, 18, 'timestamptz');
SELECT platform.create_monthly_partitions('platform', 'ai_inference_logs', CURRENT_DATE, 18, 'timestamptz');
SELECT platform.create_monthly_partitions('platform', 'analytics_events', CURRENT_DATE, 18, 'timestamptz');
SELECT platform.create_monthly_partitions('platform', 'virtual_presence_events', CURRENT_DATE, 18, 'timestamptz');
SELECT platform.create_monthly_partitions('platform', 'audit_logs', CURRENT_DATE, 18, 'timestamptz');

-- =====================================================
-- Row-Level Security (sample policy set)
-- =====================================================

ALTER TABLE platform.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_companies_tenant ON platform.companies;
CREATE POLICY p_companies_tenant ON platform.companies
  USING (tenant_id = platform.current_tenant_id());

DROP POLICY IF EXISTS p_employees_tenant ON platform.employees;
CREATE POLICY p_employees_tenant ON platform.employees
  USING (tenant_id = platform.current_tenant_id());

DROP POLICY IF EXISTS p_job_posts_tenant ON platform.job_posts;
CREATE POLICY p_job_posts_tenant ON platform.job_posts
  USING (tenant_id = platform.current_tenant_id());

DROP POLICY IF EXISTS p_analytics_tenant ON platform.analytics_events;
CREATE POLICY p_analytics_tenant ON platform.analytics_events
  USING (tenant_id = platform.current_tenant_id());

DROP POLICY IF EXISTS p_audit_tenant ON platform.audit_logs;
CREATE POLICY p_audit_tenant ON platform.audit_logs
  USING (tenant_id = platform.current_tenant_id());

COMMIT;
