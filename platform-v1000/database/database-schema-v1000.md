# Database Schema Blueprint (v1000.0)

## Primary stores
- PostgreSQL: transactional source of truth.
- Redis: cache/session/lock/queue metadata.
- Elasticsearch: search indexes for jobs, candidates, documents.
- TimescaleDB: time-series analytics and report metrics.

## PostgreSQL domain schemas

## 1. Identity and access
- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `sessions`
- `oauth_clients`
- `oauth_tokens`

## 2. Tenant and organization
- `tenants`
- `companies`
- `branches`
- `departments`
- `designations`
- `cost_centers`
- `organization_policies`

## 3. Employee lifecycle
- `employees`
- `employee_contacts`
- `employee_addresses`
- `employee_bank_accounts`
- `employee_documents`
- `employee_history`
- `employee_assets`

## 4. HR operations
- `attendance_records`
- `attendance_shifts`
- `attendance_exceptions`
- `leave_types`
- `leave_balances`
- `leave_requests`
- `leave_approvals`

## 5. Payroll and compensation
- `payroll_records`
- `payroll_components`
- `payroll_deductions`
- `payroll_payslips`
- `payroll_target_tier_rules`
- `payroll_target_plans`
- `payroll_target_achievements`
- `payroll_target_calculations`
- `payroll_dayswise_calculations`
- `payroll_monthly_payouts`

## 6. Recruitment ATS and marketplace
- `recruitment_jobs`
- `recruitment_applications`
- `interviews`
- `interview_feedback`
- `offers`
- `candidate_profiles`
- `candidate_skills`
- `recruiter_profiles`
- `placements`
- `commissions`
- `marketplace_listings`

## 7. Document and certificate engine
- `document_templates`
- `document_template_versions`
- `document_generation_jobs`
- `generated_documents`
- `certificate_templates`
- `issued_certificates`
- `employee_id_cards`
- `employee_visiting_cards`

## 8. Workflow and automation
- `workflow_trigger_definitions`
- `workflow_action_definitions`
- `workflow_rule_actions`
- `workflow_event_log`
- `workflow_execution_runs`
- `workflow_execution_actions`
- `workflow_idempotency_keys`

## 9. Employee services ecosystem
- `employee_service_catalog`
- `employee_service_enrollments`
- `insurance_policies`
- `loan_accounts`
- `wellness_program_enrollments`
- `learning_enrollments`

## 10. Billing and subscriptions
- `plans`
- `plan_features`
- `subscriptions`
- `subscription_usage`
- `invoices`
- `payments`

## 11. Analytics and observability
- `analytics_events`
- `analytics_kpi_snapshots`
- `scheduled_reports`
- `report_runs`
- `audit_logs`

## Key constraints and indexes
- Tenant index on every mutable domain table: `(tenant_id, company_id)`.
- Uniqueness: business identifiers scoped by tenant/company.
- FK integrity across company and employee lifecycle entities.
- JSONB GIN indexes for config and dynamic metadata payloads.
- Time-range indexes for reporting and payroll runs.

## Partitioning strategy
Range partition monthly for high-volume tables:
- `attendance_records`
- `analytics_events`
- `workflow_event_log`
- `workflow_execution_runs`
- `document_generation_jobs`
- `payroll_target_achievements`

Hot/cold strategy:
- 18 months hot in primary cluster.
- Older partitions archived and queryable in analytics store.

## Reference implementation
Use SQL implementation in:
- `platform-v1000/database/schema-v1000-extension.sql`
