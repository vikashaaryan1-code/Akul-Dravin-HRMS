-- v1000 compensation, automation, and workflow schema extension
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. Compensation setup and calculation audit
-- =====================================================

CREATE TABLE IF NOT EXISTS payroll_target_tier_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tier_code varchar(16) NOT NULL,
  min_achievement numeric(6,2) NOT NULL,
  max_achievement numeric(6,2) NOT NULL,
  multiplier numeric(6,3) NOT NULL,
  overflow_multiplier numeric(6,3) NOT NULL DEFAULT 0,
  spiff_enabled boolean NOT NULL DEFAULT false,
  spiff_min numeric(14,2) NOT NULL DEFAULT 0,
  spiff_max numeric(14,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'active',
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_target_tier_rule UNIQUE (tenant_id, company_id, tier_code, effective_from),
  CONSTRAINT chk_target_tier_boundaries CHECK (min_achievement >= 0 AND max_achievement >= min_achievement),
  CONSTRAINT chk_target_tier_multiplier CHECK (multiplier >= 0),
  CONSTRAINT chk_target_tier_spiff_range CHECK (spiff_min >= 0 AND spiff_max >= spiff_min)
);

CREATE INDEX IF NOT EXISTS idx_target_tier_rules_tenant_company
  ON payroll_target_tier_rules (tenant_id, company_id, status);

CREATE TABLE IF NOT EXISTS payroll_target_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_month date NOT NULL,
  base_salary numeric(14,2) NOT NULL,
  variable_salary numeric(14,2) NOT NULL,
  target_value numeric(18,2) NOT NULL,
  currency varchar(10) NOT NULL DEFAULT 'INR',
  plan_status varchar(20) NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_target_plan UNIQUE (tenant_id, employee_id, payroll_month),
  CONSTRAINT chk_target_plan_positive CHECK (
    base_salary >= 0 AND variable_salary >= 0 AND target_value > 0
  )
);

CREATE INDEX IF NOT EXISTS idx_target_plans_company_month
  ON payroll_target_plans (company_id, payroll_month);

CREATE TABLE IF NOT EXISTS payroll_target_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_month date NOT NULL,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  achieved_value numeric(18,2) NOT NULL,
  data_source varchar(50) NOT NULL DEFAULT 'manual',
  source_reference varchar(120),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, snapshot_at),
  CONSTRAINT chk_target_achievement_positive CHECK (achieved_value >= 0)
) PARTITION BY RANGE (snapshot_at);

CREATE INDEX IF NOT EXISTS idx_target_achievements_tenant_emp_month
  ON payroll_target_achievements (tenant_id, employee_id, payroll_month);

CREATE TABLE IF NOT EXISTS payroll_target_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_month date NOT NULL,
  achievement_percent numeric(8,3) NOT NULL,
  tier_code varchar(16) NOT NULL,
  multiplier numeric(8,3) NOT NULL,
  base_salary numeric(14,2) NOT NULL,
  variable_salary numeric(14,2) NOT NULL,
  variable_payout numeric(14,2) NOT NULL,
  overflow_payout numeric(14,2) NOT NULL DEFAULT 0,
  spiff_bonus numeric(14,2) NOT NULL DEFAULT 0,
  gross_payout numeric(14,2) NOT NULL,
  rule_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  algorithm_version varchar(30) NOT NULL,
  calculated_by varchar(30) NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_target_calc_positive CHECK (
    achievement_percent >= 0 AND base_salary >= 0 AND variable_salary >= 0 AND gross_payout >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_target_calc_emp_month
  ON payroll_target_calculations (employee_id, payroll_month, created_at DESC);

CREATE TABLE IF NOT EXISTS payroll_dayswise_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_month date NOT NULL,
  monthly_base_salary numeric(14,2) NOT NULL,
  working_days_in_month integer NOT NULL,
  daily_rate numeric(14,4) NOT NULL,
  paid_leave_days numeric(6,2) NOT NULL DEFAULT 0,
  unpaid_leave_days numeric(6,2) NOT NULL DEFAULT 0,
  half_days numeric(6,2) NOT NULL DEFAULT 0,
  on_duty_days numeric(6,2) NOT NULL DEFAULT 0,
  wfh_days numeric(6,2) NOT NULL DEFAULT 0,
  gross_salary numeric(14,2) NOT NULL,
  total_deductions numeric(14,2) NOT NULL,
  net_salary numeric(14,2) NOT NULL,
  deduction_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  algorithm_version varchar(30) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_dayswise_boundaries CHECK (
    monthly_base_salary >= 0
    AND working_days_in_month > 0
    AND paid_leave_days >= 0
    AND unpaid_leave_days >= 0
    AND half_days >= 0
    AND on_duty_days >= 0
    AND wfh_days >= 0
    AND total_deductions >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_dayswise_emp_month
  ON payroll_dayswise_calculations (employee_id, payroll_month, created_at DESC);

CREATE TABLE IF NOT EXISTS payroll_monthly_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_month date NOT NULL,
  payroll_record_id uuid REFERENCES payroll_records(id) ON DELETE SET NULL,
  dayswise_calculation_id uuid REFERENCES payroll_dayswise_calculations(id) ON DELETE SET NULL,
  target_calculation_id uuid REFERENCES payroll_target_calculations(id) ON DELETE SET NULL,
  net_salary numeric(14,2) NOT NULL,
  target_bonus numeric(14,2) NOT NULL DEFAULT 0,
  final_payment numeric(14,2) NOT NULL,
  payment_status varchar(20) NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_monthly_payout UNIQUE (tenant_id, employee_id, payroll_month),
  CONSTRAINT chk_monthly_payout_positive CHECK (
    net_salary >= 0 AND target_bonus >= 0 AND final_payment >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_monthly_payout_company_month
  ON payroll_monthly_payouts (company_id, payroll_month, payment_status);

-- =====================================================
-- 2. Workflow and automation engine
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_trigger_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  trigger_key varchar(120) NOT NULL,
  trigger_name varchar(200) NOT NULL,
  trigger_group varchar(60) NOT NULL,
  event_source varchar(60) NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  condition_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_trigger_definition UNIQUE (tenant_id, company_id, trigger_key)
);

CREATE INDEX IF NOT EXISTS idx_trigger_definition_enabled
  ON workflow_trigger_definitions (tenant_id, enabled, trigger_group);

CREATE TABLE IF NOT EXISTS workflow_action_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  action_key varchar(120) NOT NULL,
  action_type varchar(50) NOT NULL,
  action_name varchar(200) NOT NULL,
  timeout_seconds integer NOT NULL DEFAULT 30,
  retry_max integer NOT NULL DEFAULT 3,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_action_definition UNIQUE (tenant_id, action_key),
  CONSTRAINT chk_action_retry_timeout CHECK (timeout_seconds > 0 AND retry_max >= 0)
);

CREATE TABLE IF NOT EXISTS workflow_rule_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  trigger_definition_id uuid NOT NULL REFERENCES workflow_trigger_definitions(id) ON DELETE CASCADE,
  action_definition_id uuid NOT NULL REFERENCES workflow_action_definitions(id) ON DELETE RESTRICT,
  execution_order integer NOT NULL,
  is_blocking boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_rule_action UNIQUE (tenant_id, trigger_definition_id, action_definition_id)
);

CREATE INDEX IF NOT EXISTS idx_rule_actions_order
  ON workflow_rule_actions (trigger_definition_id, execution_order);

CREATE TABLE IF NOT EXISTS workflow_event_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  event_key varchar(120) NOT NULL,
  event_source varchar(80) NOT NULL,
  aggregate_type varchar(80) NOT NULL,
  aggregate_id uuid,
  event_payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  correlation_id varchar(120),
  idempotency_key varchar(160),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE INDEX IF NOT EXISTS idx_workflow_event_lookup
  ON workflow_event_log (tenant_id, event_key, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_event_idempotency
  ON workflow_event_log (tenant_id, idempotency_key);

CREATE TABLE IF NOT EXISTS workflow_execution_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  trigger_definition_id uuid REFERENCES workflow_trigger_definitions(id) ON DELETE SET NULL,
  event_log_id uuid,
  event_occurred_at timestamptz,
  run_status varchar(20) NOT NULL DEFAULT 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  execution_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at),
  CONSTRAINT fk_workflow_run_event FOREIGN KEY (event_log_id, event_occurred_at)
    REFERENCES workflow_event_log(id, occurred_at) ON DELETE SET NULL
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_tenant_status
  ON workflow_execution_runs (tenant_id, run_status, created_at DESC);

CREATE TABLE IF NOT EXISTS workflow_execution_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  run_id uuid NOT NULL,
  run_created_at timestamptz NOT NULL,
  action_definition_id uuid REFERENCES workflow_action_definitions(id) ON DELETE SET NULL,
  action_status varchar(20) NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  output_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_workflow_action_run FOREIGN KEY (run_id, run_created_at)
    REFERENCES workflow_execution_runs(id, created_at) ON DELETE CASCADE,
  CONSTRAINT chk_action_attempts CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_run_status
  ON workflow_execution_actions (run_id, action_status);

CREATE TABLE IF NOT EXISTS workflow_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  idempotency_key varchar(160) NOT NULL,
  target_service varchar(80) NOT NULL,
  target_operation varchar(120) NOT NULL,
  response_hash varchar(128),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_workflow_idempotency UNIQUE (tenant_id, idempotency_key, target_service)
);

CREATE INDEX IF NOT EXISTS idx_workflow_idempotency_expiry
  ON workflow_idempotency_keys (expires_at);

-- =====================================================
-- 3. Document automation and generated assets
-- =====================================================

CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  template_key varchar(120) NOT NULL,
  category varchar(60) NOT NULL,
  template_name varchar(200) NOT NULL,
  locale varchar(20) NOT NULL DEFAULT 'en-IN',
  output_format varchar(20) NOT NULL DEFAULT 'pdf',
  active_version integer NOT NULL DEFAULT 1,
  status varchar(20) NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_document_template UNIQUE (tenant_id, company_id, template_key, locale)
);

CREATE INDEX IF NOT EXISTS idx_document_templates_category
  ON document_templates (tenant_id, category, status);

CREATE TABLE IF NOT EXISTS document_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  schema_json jsonb NOT NULL,
  html_template text NOT NULL,
  css_template text,
  signature_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  watermark_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(20) NOT NULL DEFAULT 'draft',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_template_version UNIQUE (template_id, version_no)
);

CREATE TABLE IF NOT EXISTS document_generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  trigger_run_id uuid,
  trigger_run_created_at timestamptz,
  template_id uuid REFERENCES document_templates(id) ON DELETE SET NULL,
  template_version_id uuid REFERENCES document_template_versions(id) ON DELETE SET NULL,
  job_status varchar(20) NOT NULL DEFAULT 'queued',
  input_data jsonb NOT NULL,
  output_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  storage_key varchar(260),
  error_message text,
  requested_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at),
  CONSTRAINT fk_document_job_run FOREIGN KEY (trigger_run_id, trigger_run_created_at)
    REFERENCES workflow_execution_runs(id, created_at) ON DELETE SET NULL
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_document_jobs_tenant_status
  ON document_generation_jobs (tenant_id, job_status, created_at DESC);

CREATE TABLE IF NOT EXISTS generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  generation_job_id uuid,
  generation_job_created_at timestamptz,
  document_type varchar(60) NOT NULL,
  document_code varchar(80),
  file_name varchar(200) NOT NULL,
  file_format varchar(20) NOT NULL,
  file_size_bytes bigint,
  storage_key varchar(260) NOT NULL,
  checksum_sha256 varchar(64) NOT NULL,
  visibility_scope varchar(30) NOT NULL DEFAULT 'private',
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_generated_document_job FOREIGN KEY (generation_job_id, generation_job_created_at)
    REFERENCES document_generation_jobs(id, created_at) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_generated_documents_employee
  ON generated_documents (employee_id, document_type, issued_at DESC);

CREATE TABLE IF NOT EXISTS employee_id_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  generated_document_id uuid REFERENCES generated_documents(id) ON DELETE SET NULL,
  card_serial_no varchar(50) NOT NULL,
  qr_code_payload text,
  barcode_payload text,
  has_rfid boolean NOT NULL DEFAULT false,
  has_magnetic_strip boolean NOT NULL DEFAULT false,
  issue_date date NOT NULL,
  valid_till date,
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_employee_id_card UNIQUE (tenant_id, employee_id, card_serial_no)
);

CREATE TABLE IF NOT EXISTS employee_visiting_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  generated_document_id uuid REFERENCES generated_documents(id) ON DELETE SET NULL,
  design_template_key varchar(120) NOT NULL,
  language_code varchar(10) NOT NULL DEFAULT 'en',
  print_status varchar(20) NOT NULL DEFAULT 'queued',
  quantity integer NOT NULL DEFAULT 100,
  digital_pdf_storage_key varchar(260),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_visiting_cards_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_visiting_cards_employee_status
  ON employee_visiting_cards (employee_id, print_status, created_at DESC);

-- =====================================================
-- 4. Employee service automation
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  service_key varchar(120) NOT NULL,
  service_group varchar(60) NOT NULL,
  service_name varchar(200) NOT NULL,
  default_enabled boolean NOT NULL DEFAULT false,
  billing_mode varchar(30) NOT NULL DEFAULT 'included',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_service_catalog UNIQUE (tenant_id, service_key)
);

CREATE TABLE IF NOT EXISTS employee_service_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  service_catalog_id uuid NOT NULL REFERENCES employee_service_catalog(id) ON DELETE RESTRICT,
  enrollment_status varchar(20) NOT NULL DEFAULT 'active',
  enrolled_via varchar(30) NOT NULL DEFAULT 'workflow',
  start_date date NOT NULL,
  end_date date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_employee_service UNIQUE (tenant_id, employee_id, service_catalog_id, start_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_service_status
  ON employee_service_enrollments (company_id, enrollment_status, start_date DESC);

-- =====================================================
-- 5. Suggested monthly partitions
-- =====================================================

DO $$
DECLARE
  month_start date := date_trunc('month', now())::date;
  next_month date := (date_trunc('month', now()) + interval '1 month')::date;
  month_after_next date := (date_trunc('month', now()) + interval '2 months')::date;
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS payroll_target_achievements_%s PARTITION OF payroll_target_achievements FOR VALUES FROM (%L) TO (%L)',
    to_char(month_start, 'YYYYMM'), month_start, next_month
  );

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS payroll_target_achievements_%s PARTITION OF payroll_target_achievements FOR VALUES FROM (%L) TO (%L)',
    to_char(next_month, 'YYYYMM'), next_month, month_after_next
  );

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS workflow_event_log_%s PARTITION OF workflow_event_log FOR VALUES FROM (%L) TO (%L)',
    to_char(month_start, 'YYYYMM'), month_start, next_month
  );

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS workflow_event_log_%s PARTITION OF workflow_event_log FOR VALUES FROM (%L) TO (%L)',
    to_char(next_month, 'YYYYMM'), next_month, month_after_next
  );

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS workflow_execution_runs_%s PARTITION OF workflow_execution_runs FOR VALUES FROM (%L) TO (%L)',
    to_char(month_start, 'YYYYMM'), month_start, next_month
  );

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS workflow_execution_runs_%s PARTITION OF workflow_execution_runs FOR VALUES FROM (%L) TO (%L)',
    to_char(next_month, 'YYYYMM'), next_month, month_after_next
  );

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS document_generation_jobs_%s PARTITION OF document_generation_jobs FOR VALUES FROM (%L) TO (%L)',
    to_char(month_start, 'YYYYMM'), month_start, next_month
  );

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS document_generation_jobs_%s PARTITION OF document_generation_jobs FOR VALUES FROM (%L) TO (%L)',
    to_char(next_month, 'YYYYMM'), next_month, month_after_next
  );
END $$;
