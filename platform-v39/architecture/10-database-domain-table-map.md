# 10. Database Domain Table Map (300+ Plan)

## Target
Design and implement 300+ normalized operational tables plus analytical aggregates.

## Domain Table Allocation
| Domain | Planned Tables |
|---|---:|
| Identity, IAM, Sessions, Policies | 24 |
| Tenant, Region, White-label Partner | 18 |
| Organization (Company/Branch/Dept/Designation) | 20 |
| Employee Core + Docs + Lifecycle | 36 |
| Attendance, Shift, Overtime, Corrections | 28 |
| Leave Policies, Balances, Requests, Approvals | 24 |
| Payroll, Components, Runs, Payslips, Compliance | 34 |
| Recruitment ATS (Jobs, Apps, Interviews, Offers) | 32 |
| Candidate Ecosystem (Profiles, Skills, Preferences) | 22 |
| Recruiter Marketplace (Assignments, Placements, Commission) | 26 |
| ERP Finance (COA, Journals, GL, Close) | 24 |
| ERP Procurement + Vendors + PO + GRN | 22 |
| ERP Inventory + Warehouse + Movement | 20 |
| ERP Assets + Budget + Expense | 20 |
| Subscription, Pricing, Invoicing, Payments | 20 |
| Analytics Events + KPI + Reports | 22 |
| AI Registry, Features, Inference, Drift | 20 |
| Metaverse Office, Rooms, Presence, Session | 12 |
| Notification, Template, Webhook Delivery | 14 |
| **Total** | **438** |

## Naming Convention
- Schema: `platform`
- Table names: plural snake_case
- Primary key: `id` UUID
- Tenant key: `tenant_id` mandatory for tenant-owned rows

## Mandatory Columns Pattern
- `id`, `tenant_id`, `created_at`, `updated_at`
- Domain flags: `status`, `metadata` (jsonb)

## Integrity Rules
- Composite foreign keys `(tenant_id, id)` for isolation-safe references
- Strict CHECK constraints for state enums
- Soft-delete only where regulatory safe

## Scale Rules
- Partition event and log heavy tables monthly
- Add GIN indexes on selective jsonb payloads
- Materialized views for expensive dashboard aggregations
