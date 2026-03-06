-- AKUL DRAVIN HRMS AI SUPER PLATFORM
-- Scalable PostgreSQL Multi-Tenant Schema (v1)
-- Date: 2026-03-05

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS hrms;
SET search_path TO hrms, public;

-- =========================================================
-- Helpers
-- =========================================================

CREATE OR REPLACE FUNCTION hrms.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION hrms.create_monthly_range_partitions(
  p_schema_name text,
  p_table_name text,
  p_start_month date,
  p_month_count integer,
  p_is_timestamptz boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_from date;
  v_to date;
  v_part_name text;
  i integer;
BEGIN
  IF p_month_count < 1 THEN
    RAISE EXCEPTION 'p_month_count must be >= 1';
  END IF;

  FOR i IN 0..(p_month_count - 1) LOOP
    v_from := (date_trunc('month', p_start_month) + make_interval(months => i))::date;
    v_to := (v_from + INTERVAL '1 month')::date;
    v_part_name := format('%s_%s', p_table_name, to_char(v_from, 'YYYYMM'));

    IF p_is_timestamptz THEN
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I.%I PARTITION OF %I.%I FOR VALUES FROM (%L) TO (%L);',
        p_schema_name,
        v_part_name,
        p_schema_name,
        p_table_name,
        v_from::text || ' 00:00:00+00',
        v_to::text || ' 00:00:00+00'
      );
    ELSE
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I.%I PARTITION OF %I.%I FOR VALUES FROM (%L) TO (%L);',
        p_schema_name,
        v_part_name,
        p_schema_name,
        p_table_name,
        v_from,
        v_to
      );
    END IF;
  END LOOP;
END;
$$;

-- =========================================================
-- Tenant + Subscription
-- =========================================================

CREATE TABLE IF NOT EXISTS hrms.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key varchar(80) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  region_code varchar(16) NOT NULL DEFAULT 'IN',
  timezone varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hrms.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code varchar(60) NOT NULL UNIQUE,
  plan_name varchar(120) NOT NULL,
  category varchar(50) NOT NULL CHECK (category IN ('hrms', 'recruitment', 'recruiter', 'combined', 'white_label')),
  billing_cycle varchar(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  base_price numeric(14,2) NOT NULL CHECK (base_price >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- Organization
-- =========================================================

CREATE TABLE IF NOT EXISTS hrms.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_code varchar(40) NOT NULL,
  legal_name varchar(220) NOT NULL,
  display_name varchar(220) NOT NULL,
  industry varchar(120),
  country varchar(80) NOT NULL DEFAULT 'India',
  timezone varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_companies_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT uq_companies_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_companies_code UNIQUE (tenant_id, company_code)
);

CREATE TABLE IF NOT EXISTS hrms.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  branch_code varchar(40) NOT NULL,
  branch_name varchar(180) NOT NULL,
  city varchar(100) NOT NULL,
  state varchar(100),
  country varchar(80) NOT NULL DEFAULT 'India',
  timezone varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_branches_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_branches_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_branches_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_branches_code UNIQUE (tenant_id, company_id, branch_code)
);

CREATE TABLE IF NOT EXISTS hrms.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  branch_id uuid,
  parent_department_id uuid,
  department_code varchar(40) NOT NULL,
  department_name varchar(160) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_departments_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_departments_branch FOREIGN KEY (tenant_id, branch_id) REFERENCES hrms.branches(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_departments_parent FOREIGN KEY (tenant_id, parent_department_id) REFERENCES hrms.departments(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT uq_departments_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_departments_code UNIQUE (tenant_id, company_id, department_code)
);

-- =========================================================
-- Recruiters + Employees
-- =========================================================

CREATE TABLE IF NOT EXISTS hrms.recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid,
  branch_id uuid,
  recruiter_type varchar(30) NOT NULL CHECK (recruiter_type IN ('internal', 'agency', 'freelance', 'global_partner', 'ai_bot')),
  first_name varchar(80) NOT NULL,
  last_name varchar(80),
  email citext NOT NULL,
  phone varchar(30),
  agency_name varchar(180),
  commission_rate numeric(5,2) NOT NULL DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  rating numeric(3,2) NOT NULL DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_recruiters_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_recruiters_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_recruiters_branch FOREIGN KEY (tenant_id, branch_id) REFERENCES hrms.branches(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT uq_recruiters_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_recruiters_email UNIQUE (tenant_id, email),
  CONSTRAINT ck_recruiters_internal_company CHECK (
    (recruiter_type = 'internal' AND company_id IS NOT NULL)
    OR recruiter_type <> 'internal'
  )
);
CREATE TABLE IF NOT EXISTS hrms.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  branch_id uuid,
  department_id uuid,
  manager_id uuid,
  employee_code varchar(50) NOT NULL,
  first_name varchar(80) NOT NULL,
  last_name varchar(80),
  work_email citext NOT NULL,
  personal_email citext,
  phone varchar(30),
  employment_type varchar(20) NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'consultant')),
  designation varchar(120) NOT NULL,
  join_date date NOT NULL,
  exit_date date,
  monthly_ctc numeric(14,2) CHECK (monthly_ctc >= 0),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive', 'exited')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_employees_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_employees_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_employees_branch FOREIGN KEY (tenant_id, branch_id) REFERENCES hrms.branches(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_employees_department FOREIGN KEY (tenant_id, department_id) REFERENCES hrms.departments(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_employees_manager FOREIGN KEY (tenant_id, manager_id) REFERENCES hrms.employees(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT uq_employees_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_employees_code UNIQUE (tenant_id, employee_code),
  CONSTRAINT uq_employees_work_email UNIQUE (tenant_id, work_email),
  CONSTRAINT ck_employees_exit_date CHECK (exit_date IS NULL OR exit_date >= join_date)
);

-- =========================================================
-- Attendance (Partitioned)
-- =========================================================

CREATE TABLE IF NOT EXISTS hrms.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  attendance_date date NOT NULL,
  shift_code varchar(40),
  check_in_at timestamptz,
  check_out_at timestamptz,
  status varchar(20) NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'holiday', 'week_off')),
  source varchar(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'gps', 'biometric', 'face', 'api')),
  latitude numeric(9,6),
  longitude numeric(9,6),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_attendance_records PRIMARY KEY (attendance_date, id),
  CONSTRAINT fk_attendance_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_attendance_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES hrms.employees(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_attendance_one_per_day UNIQUE (tenant_id, employee_id, attendance_date),
  CONSTRAINT ck_attendance_checkout_after_checkin CHECK (
    check_out_at IS NULL OR check_in_at IS NULL OR check_out_at >= check_in_at
  )
) PARTITION BY RANGE (attendance_date);

CREATE TABLE IF NOT EXISTS hrms.attendance_records_default
PARTITION OF hrms.attendance_records DEFAULT;

-- =========================================================
-- Leave
-- =========================================================

CREATE TABLE IF NOT EXISTS hrms.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid,
  leave_code varchar(30) NOT NULL,
  leave_name varchar(100) NOT NULL,
  annual_quota numeric(8,2) NOT NULL DEFAULT 0 CHECK (annual_quota >= 0),
  can_carry_forward boolean NOT NULL DEFAULT false,
  max_carry_forward numeric(8,2) NOT NULL DEFAULT 0 CHECK (max_carry_forward >= 0),
  is_encashable boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_leave_types_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leave_types_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_leave_types_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_leave_types_code UNIQUE (tenant_id, leave_code)
);

CREATE TABLE IF NOT EXISTS hrms.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  leave_type_id uuid NOT NULL,
  leave_year int NOT NULL CHECK (leave_year BETWEEN 2000 AND 2100),
  opening_balance numeric(8,2) NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
  credited numeric(8,2) NOT NULL DEFAULT 0 CHECK (credited >= 0),
  debited numeric(8,2) NOT NULL DEFAULT 0 CHECK (debited >= 0),
  closing_balance numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_leave_balances_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leave_balances_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES hrms.employees(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_balances_leave_type FOREIGN KEY (tenant_id, leave_type_id) REFERENCES hrms.leave_types(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_leave_balances_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_leave_balances_employee_type_year UNIQUE (tenant_id, employee_id, leave_type_id, leave_year)
);

CREATE TABLE IF NOT EXISTS hrms.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  leave_type_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  requested_days numeric(6,2) NOT NULL CHECK (requested_days > 0),
  reason text,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approver_id uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_leave_requests_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leave_requests_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_requests_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES hrms.employees(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_requests_leave_type FOREIGN KEY (tenant_id, leave_type_id) REFERENCES hrms.leave_types(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_leave_requests_approver FOREIGN KEY (tenant_id, approver_id) REFERENCES hrms.employees(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT uq_leave_requests_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT ck_leave_requests_date_range CHECK (end_date >= start_date)
);
-- =========================================================
-- Payroll (Partitioned)
-- =========================================================

CREATE TABLE IF NOT EXISTS hrms.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  period_year int NOT NULL CHECK (period_year BETWEEN 2000 AND 2100),
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_start date NOT NULL,
  period_end date NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'processed', 'published', 'cancelled')),
  total_employees int NOT NULL DEFAULT 0 CHECK (total_employees >= 0),
  total_gross numeric(16,2) NOT NULL DEFAULT 0 CHECK (total_gross >= 0),
  total_net numeric(16,2) NOT NULL DEFAULT 0 CHECK (total_net >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_payroll_runs_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payroll_runs_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_payroll_runs_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_payroll_runs_period UNIQUE (tenant_id, company_id, period_year, period_month),
  CONSTRAINT ck_payroll_runs_period_range CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS hrms.payroll_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  payroll_run_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_pay numeric(14,2) NOT NULL DEFAULT 0 CHECK (gross_pay >= 0),
  deductions numeric(14,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  net_pay numeric(14,2) NOT NULL DEFAULT 0 CHECK (net_pay >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid')),
  payslip_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_payroll_records PRIMARY KEY (period_start, id),
  CONSTRAINT fk_payroll_records_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payroll_records_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_payroll_records_run FOREIGN KEY (tenant_id, payroll_run_id) REFERENCES hrms.payroll_runs(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_payroll_records_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES hrms.employees(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_payroll_records_employee_per_run UNIQUE (tenant_id, payroll_run_id, employee_id, period_start),
  CONSTRAINT ck_payroll_records_period_range CHECK (period_end >= period_start)
) PARTITION BY RANGE (period_start);

CREATE TABLE IF NOT EXISTS hrms.payroll_records_default
PARTITION OF hrms.payroll_records DEFAULT;

-- =========================================================
-- Jobs / Applications / Interviews
-- =========================================================

CREATE TABLE IF NOT EXISTS hrms.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  branch_id uuid,
  department_id uuid,
  posted_by_recruiter_id uuid,
  job_code varchar(50) NOT NULL,
  title varchar(180) NOT NULL,
  description text NOT NULL,
  location varchar(150) NOT NULL,
  job_type varchar(20) NOT NULL CHECK (job_type IN ('full_time', 'part_time', 'remote', 'contract', 'internship')),
  experience_min_years numeric(4,1) DEFAULT 0 CHECK (experience_min_years >= 0),
  experience_max_years numeric(4,1) CHECK (experience_max_years IS NULL OR experience_max_years >= experience_min_years),
  salary_min numeric(14,2) CHECK (salary_min IS NULL OR salary_min >= 0),
  salary_max numeric(14,2) CHECK (salary_max IS NULL OR salary_max >= salary_min),
  currency char(3) NOT NULL DEFAULT 'INR',
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'on_hold', 'closed', 'cancelled')),
  application_deadline date,
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_jobs_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_jobs_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_branch FOREIGN KEY (tenant_id, branch_id) REFERENCES hrms.branches(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_department FOREIGN KEY (tenant_id, department_id) REFERENCES hrms.departments(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_posted_by FOREIGN KEY (tenant_id, posted_by_recruiter_id) REFERENCES hrms.recruiters(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT uq_jobs_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_jobs_code UNIQUE (tenant_id, job_code)
);

CREATE TABLE IF NOT EXISTS hrms.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  job_id uuid NOT NULL,
  candidate_name varchar(180) NOT NULL,
  candidate_email citext NOT NULL,
  candidate_phone varchar(30),
  resume_url text,
  source varchar(30) NOT NULL DEFAULT 'portal' CHECK (source IN ('portal', 'referral', 'linkedin', 'agency', 'import', 'other')),
  assigned_recruiter_id uuid,
  stage varchar(25) NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied', 'screening', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn')),
  ai_match_score numeric(5,2) CHECK (ai_match_score IS NULL OR (ai_match_score >= 0 AND ai_match_score <= 100)),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hired', 'rejected', 'withdrawn')),
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_applications_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_applications_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_job FOREIGN KEY (tenant_id, job_id) REFERENCES hrms.jobs(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_recruiter FOREIGN KEY (tenant_id, assigned_recruiter_id) REFERENCES hrms.recruiters(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT uq_applications_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_applications_job_candidate UNIQUE (tenant_id, job_id, candidate_email)
);

CREATE TABLE IF NOT EXISTS hrms.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  application_id uuid NOT NULL,
  job_id uuid NOT NULL,
  round_number int NOT NULL DEFAULT 1 CHECK (round_number > 0),
  interview_type varchar(20) NOT NULL CHECK (interview_type IN ('phone', 'video', 'onsite', 'assignment')),
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  interviewer_employee_id uuid,
  interviewer_recruiter_id uuid,
  status varchar(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  score numeric(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  feedback text,
  ai_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_interviews_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_interviews_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_interviews_application FOREIGN KEY (tenant_id, application_id) REFERENCES hrms.applications(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_interviews_job FOREIGN KEY (tenant_id, job_id) REFERENCES hrms.jobs(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_interviews_employee FOREIGN KEY (tenant_id, interviewer_employee_id) REFERENCES hrms.employees(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_interviews_recruiter FOREIGN KEY (tenant_id, interviewer_recruiter_id) REFERENCES hrms.recruiters(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT uq_interviews_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_interviews_round UNIQUE (tenant_id, application_id, round_number),
  CONSTRAINT ck_interviews_schedule CHECK (scheduled_end > scheduled_start)
);

CREATE TABLE IF NOT EXISTS hrms.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_id uuid NOT NULL,
  listing_type varchar(30) NOT NULL DEFAULT 'job' CHECK (listing_type IN ('job', 'service', 'campaign')),
  visibility varchar(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'partner')),
  source_service varchar(60) NOT NULL DEFAULT 'job-marketplace',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_marketplace_listings_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_marketplace_listings_job FOREIGN KEY (tenant_id, job_id) REFERENCES hrms.jobs(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_marketplace_listings_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_marketplace_listings_job UNIQUE (tenant_id, job_id)
);
-- =========================================================
-- Subscriptions
-- =========================================================

CREATE TABLE IF NOT EXISTS hrms.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid,
  plan_id uuid NOT NULL,
  starts_on date NOT NULL,
  ends_on date,
  billing_cycle varchar(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_subscriptions_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES hrms.subscription_plans(id) ON DELETE RESTRICT,
  CONSTRAINT uq_subscriptions_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT ck_subscriptions_date_range CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

-- =========================================================
-- Analytics Events (Partitioned)
-- =========================================================

CREATE TABLE IF NOT EXISTS hrms.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid,
  module varchar(50) NOT NULL,
  event_name varchar(120) NOT NULL,
  actor_type varchar(40),
  actor_id uuid,
  entity_type varchar(60),
  entity_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_analytics_events PRIMARY KEY (occurred_at, id),
  CONSTRAINT fk_analytics_tenant FOREIGN KEY (tenant_id) REFERENCES hrms.tenants(id) ON DELETE RESTRICT,
  CONSTRAINT fk_analytics_company FOREIGN KEY (tenant_id, company_id) REFERENCES hrms.companies(tenant_id, id) ON DELETE SET NULL
) PARTITION BY RANGE (occurred_at);

CREATE TABLE IF NOT EXISTS hrms.analytics_events_default
PARTITION OF hrms.analytics_events DEFAULT;

-- =========================================================
-- Indexes (OLTP + reporting aligned)
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_companies_tenant_status ON hrms.companies (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_companies_tenant_created ON hrms.companies (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_branches_tenant_company ON hrms.branches (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_branches_tenant_status ON hrms.branches (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_departments_tenant_company ON hrms.departments (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant_parent ON hrms.departments (tenant_id, parent_department_id);

CREATE INDEX IF NOT EXISTS idx_recruiters_tenant_type_status ON hrms.recruiters (tenant_id, recruiter_type, status);
CREATE INDEX IF NOT EXISTS idx_recruiters_tenant_company ON hrms.recruiters (tenant_id, company_id);

CREATE INDEX IF NOT EXISTS idx_employees_tenant_company_branch ON hrms.employees (tenant_id, company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_department_status ON hrms.employees (tenant_id, department_id, status);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_manager ON hrms.employees (tenant_id, manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_join_date ON hrms.employees (tenant_id, join_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_employee_date ON hrms.attendance_records (tenant_id, employee_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_company_date ON hrms.attendance_records (tenant_id, company_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_status_date ON hrms.attendance_records (tenant_id, status, attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_leave_balances_tenant_employee_year ON hrms.leave_balances (tenant_id, employee_id, leave_year);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_employee_dates ON hrms.leave_requests (tenant_id, employee_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_status_dates ON hrms.leave_requests (tenant_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_approver ON hrms.leave_requests (tenant_id, approver_id, status);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant_company_period ON hrms.payroll_runs (tenant_id, company_id, period_year DESC, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant_status ON hrms.payroll_runs (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_payroll_records_tenant_run ON hrms.payroll_records (tenant_id, payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_tenant_employee_period ON hrms.payroll_records (tenant_id, employee_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_records_tenant_status_period ON hrms.payroll_records (tenant_id, status, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_status_posted ON hrms.jobs (tenant_id, status, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_company_department ON hrms.jobs (tenant_id, company_id, department_id);
CREATE INDEX IF NOT EXISTS idx_jobs_search ON hrms.jobs USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS idx_applications_tenant_job_stage ON hrms.applications (tenant_id, job_id, stage);
CREATE INDEX IF NOT EXISTS idx_applications_tenant_candidate_email ON hrms.applications (tenant_id, candidate_email);
CREATE INDEX IF NOT EXISTS idx_applications_tenant_recruiter_stage ON hrms.applications (tenant_id, assigned_recruiter_id, stage);
CREATE INDEX IF NOT EXISTS idx_applications_tenant_applied_at ON hrms.applications (tenant_id, applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_interviews_tenant_application ON hrms.interviews (tenant_id, application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_tenant_schedule ON hrms.interviews (tenant_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_interviews_tenant_status_schedule ON hrms.interviews (tenant_id, status, scheduled_start);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_tenant_visibility_status
  ON hrms.marketplace_listings (tenant_id, visibility, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_tenant_source
  ON hrms.marketplace_listings (tenant_id, source_service, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON hrms.subscriptions (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_company ON hrms.subscriptions (tenant_id, company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_active_per_scope
  ON hrms.subscriptions (tenant_id, coalesce(company_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE status IN ('active', 'trial');

CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_time ON hrms.analytics_events (tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_module_time ON hrms.analytics_events (tenant_id, module, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_payload_gin ON hrms.analytics_events USING GIN (payload);
-- =========================================================
-- Partition creation strategy
-- - Monthly partitions
-- - Keep 6 months back + 24 months forward by default
-- - Run this in scheduled maintenance monthly
-- =========================================================

SELECT hrms.create_monthly_range_partitions(
  'hrms',
  'attendance_records',
  (date_trunc('month', current_date) - INTERVAL '6 months')::date,
  30,
  false
);

SELECT hrms.create_monthly_range_partitions(
  'hrms',
  'payroll_records',
  (date_trunc('month', current_date) - INTERVAL '6 months')::date,
  30,
  false
);

SELECT hrms.create_monthly_range_partitions(
  'hrms',
  'analytics_events',
  (date_trunc('month', current_date) - INTERVAL '6 months')::date,
  30,
  true
);

-- =========================================================
-- Row-Level Security baseline for tenant isolation
-- App must set: SET app.tenant_id = '<tenant-uuid>'
-- =========================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'companies',
      'branches',
      'departments',
      'recruiters',
      'employees',
      'attendance_records',
      'leave_types',
      'leave_balances',
      'leave_requests',
      'payroll_runs',
      'payroll_records',
      'jobs',
      'applications',
      'interviews',
      'marketplace_listings',
      'subscriptions',
      'analytics_events'
    ])
  LOOP
    EXECUTE format('ALTER TABLE hrms.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON hrms.%I;', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON hrms.%I USING (tenant_id = hrms.current_tenant_id()) WITH CHECK (tenant_id = hrms.current_tenant_id());',
      tbl
    );
  END LOOP;
END $$;

COMMIT;

-- =========================================================
-- Operational partitioning notes
-- 1) Detach/archive old partitions (attendance/payroll >= 7 years, analytics >= 2 years hot)
-- 2) Keep default partition monitored; new months should be pre-created by scheduler
-- 3) For very large tenants, optionally sub-partition analytics by HASH(tenant_id)
-- =========================================================

