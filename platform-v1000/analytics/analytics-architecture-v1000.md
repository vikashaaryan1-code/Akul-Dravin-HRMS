# Analytics and Reporting Architecture (v1000.0)

## Objectives
- 500+ report templates.
- Real-time dashboards.
- Predictive analytics and planning outputs.

## Data flow
1. Events from domain services to event bus.
2. Stream/batch ingestion into TimescaleDB and search analytics indexes.
3. Aggregation jobs produce KPI snapshots and materialized views.
4. Dashboard APIs serve low-latency analytics responses.

## Reporting domains
- Workforce and headcount.
- Attendance and leave.
- Payroll and compensation.
- Recruitment pipeline and quality.
- Recruiter marketplace performance.
- Employee services utilization.
- Subscription and revenue analytics.
- AI model quality and adoption.

## Report architecture
- Prebuilt reports by role and plan tier.
- Custom report builder with saved filters and schedules.
- Export outputs: CSV, XLSX, PDF.

## Freshness tiers
- Real-time: <= 1 minute lag (key operational KPIs).
- Near real-time: <= 15 minute lag.
- Batch: hourly/daily for deep analytics.

## Governance
- Role and tenant-aware data filtering.
- Query budgets and usage throttles.
- Lineage tracking for KPI definitions.
