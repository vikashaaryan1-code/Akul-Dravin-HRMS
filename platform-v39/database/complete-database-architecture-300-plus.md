# Complete Database Architecture (300+ Tables)

## Scope
- Target: enterprise-grade, multi-tenant schema for AKUL DRAVIN HRMS & ERP v39.0
- Total planned operational tables in this catalog: **621**
- Catalog source: `table-catalog-v39.csv`

## Core Principles
- All tenant-owned tables include `tenant_id` and use tenant-safe foreign keys.
- UUID primary keys, strict enum/check constraints, and auditable change trails.
- Time-series heavy tables use monthly partition strategy or Timescale hypertables.
- PII classification and column-level policy controls are mandatory.

## Domain-Wise Table Allocation
| Domain | Table Count | Primary Service |
|---|---:|---|
| ai_platform | 38 | ai-engine-service |
| analytics_reporting | 39 | analytics-service |
| attendance_leave | 40 | attendance-service |
| billing_subscription | 33 | billing-service |
| core_identity | 24 | auth-service |
| erp_assets_budget | 30 | erp-assets-service |
| erp_finance | 45 | erp-finance-service |
| erp_inventory | 34 | erp-inventory-service |
| erp_procurement | 30 | erp-procurement-service |
| metaverse | 20 | metaverse-service |
| organization_hrms | 47 | employee-service |
| payroll | 51 | payroll-service |
| performance_lms | 24 | employee-service |
| platform_ops_security | 30 | platform-ops-service |
| recruiter_marketplace | 35 | recruiter-service |
| recruitment_ats | 49 | recruitment-service |
| tenant_whitelabel | 22 | company-service |
| workflow_notification_integration | 30 | notification-service |

## Relationship Backbone (Critical)
- `tenants -> companies -> branches -> departments -> employees`
- `employees -> attendance_records -> payroll_runs/payroll_run_items/payslips`
- `job_requisitions/job_posts -> applications -> interviews -> offers -> hire_events`
- `recruiters -> recruiter_assignments -> recruiter_candidate_submissions -> recruiter_placements -> commission_payouts`
- `subscriptions -> invoices -> payments`
- `analytics_events`, `audit_logs`, `ai_inference_logs` feed reporting and AI monitoring layers.

## Partition and Retention Model
- Monthly partition tables: events/logs/snapshots/inference/presence streams.
- Retention tiers: hot (0-6m), warm (7-24m), cold archive (24m+ as policy requires).
- See: `partitioning-strategy.md` and `timescaledb-hypertables.sql`.

## Implementation Guidance
1. Implement in domain migration packs (IAM, HRMS, ERP, Talent, Billing, Analytics, AI, Metaverse).
2. Enforce RLS + app-layer authorization together.
3. Validate every migration with contract tests and data rollback drills.
4. Use materialized views for heavy dashboards; keep OLTP paths lean.

## Artifacts
- `table-catalog-v39.csv` (full 300+ table list)
- `schema-v39.sql` (reference consolidated schema)
- `timescaledb-hypertables.sql` (high-volume time-series optimization)
