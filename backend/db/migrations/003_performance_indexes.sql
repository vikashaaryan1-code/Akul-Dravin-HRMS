-- ═══════════════════════════════════════════════════════════════════════════════
-- AKUL DRAVIN HRMS AI — Database Performance Indexes
-- Run this migration to add critical indexes for production performance.
-- Compatible with: PostgreSQL 14+
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Employees ─────────────────────────────────────────────────────────────────

-- Primary lookup: email and tenant combo (login, profile lookup)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_email_tenant
  ON employees (email, tenant_id)
  WHERE deleted_at IS NULL;

-- Org-tree queries: department filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department_tenant
  ON employees (department_id, tenant_id)
  WHERE deleted_at IS NULL;

-- Status filtering (active vs. inactive dashboard counts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_status_tenant
  ON employees (status, tenant_id);

-- Manager hierarchy (org chart, reporting chain)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_manager_id
  ON employees (manager_id)
  WHERE manager_id IS NOT NULL;

-- Full text search on employee name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_name_fts
  ON employees USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- ── Attendance ────────────────────────────────────────────────────────────────

-- Date range queries (most frequent: get attendance for a month)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_employee_date
  ON attendance (employee_id, attendance_date DESC);

-- Tenant-wide date range (payroll processing, compliance reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_tenant_date
  ON attendance (tenant_id, attendance_date DESC);

-- Status queries (absent/present/late counts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_status_date
  ON attendance (status, attendance_date DESC, tenant_id);

-- ── Payroll ───────────────────────────────────────────────────────────────────

-- Payroll period queries (most common access pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_employee_period
  ON payroll_records (employee_id, period_year DESC, period_month DESC);

-- Tenant-wide payroll for bulk processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_tenant_period
  ON payroll_records (tenant_id, period_year DESC, period_month DESC);

-- Processing status (pending → processed pipeline)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_status_tenant
  ON payroll_records (status, tenant_id)
  WHERE status IN ('pending', 'processing');

-- ── Leave Management ──────────────────────────────────────────────────────────

-- Employee leave history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_employee
  ON leave_requests (employee_id, status, created_at DESC);

-- Manager approval queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_approver
  ON leave_requests (approver_id, status)
  WHERE status = 'pending';

-- Tenant-wide leave calendar (overlapping leave detection)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_dates
  ON leave_requests (tenant_id, start_date, end_date)
  WHERE status = 'approved';

-- ── Recruitment / ATS ─────────────────────────────────────────────────────────

-- Job listing queries (active jobs by department)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_tenant_status
  ON job_postings (tenant_id, status, created_at DESC)
  WHERE status = 'active';

-- Candidate pipeline stage
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_job_stage
  ON candidates (job_id, stage, created_at DESC);

-- Candidate email lookup (deduplication)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_email
  ON candidates (email, tenant_id);

-- ── Performance & OKRs ────────────────────────────────────────────────────────

-- OKR by cycle and employee
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_okrs_employee_cycle
  ON okrs (employee_id, cycle_id, status);

-- Team performance aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_okrs_team_cycle
  ON okrs (team_id, cycle_id)
  WHERE team_id IS NOT NULL;

-- ── Audit Logs ────────────────────────────────────────────────────────────────

-- Audit trail queries (compliance, security investigations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_time
  ON audit_logs (tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_time
  ON audit_logs (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs (resource_type, resource_id, tenant_id);

-- ── Notifications ─────────────────────────────────────────────────────────────

-- Unread notifications (badge count)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

-- ── Tenants (Multi-tenant routing) ───────────────────────────────────────────

-- Subdomain → tenant lookup (used on every request by middleware)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_subdomain
  ON tenants (subdomain)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_custom_domain
  ON tenants (custom_domain)
  WHERE custom_domain IS NOT NULL AND deleted_at IS NULL;

-- ── Documents ─────────────────────────────────────────────────────────────────

-- Document listing by entity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_entity
  ON documents (entity_type, entity_id, tenant_id, created_at DESC);

-- ── pgvector — AI Embeddings ──────────────────────────────────────────────────
-- Requires pgvector extension. Run: CREATE EXTENSION IF NOT EXISTS vector;
-- IVFFlat index for cosine similarity search (HR knowledge base)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_vector
--   ON ai_knowledge_base USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ANALYZE after indexing to update planner statistics
-- ═══════════════════════════════════════════════════════════════════════════════
ANALYZE employees;
ANALYZE attendance;
ANALYZE payroll_records;
ANALYZE leave_requests;
ANALYZE job_postings;
ANALYZE candidates;
ANALYZE audit_logs;
ANALYZE notifications;
