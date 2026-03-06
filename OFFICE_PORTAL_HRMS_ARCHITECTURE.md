# AKUL DRAVIN OFFICE PORTAL & HRMS PLATFORM

## 1. Enterprise Architecture

### 1.1 Layered Architecture
- Experience Layer: Next.js + React + TypeScript + TailwindCSS web portal with role dashboards.
- Access Layer: JWT auth + RBAC authorization guards + policy enforcement middleware.
- Business Layer: NestJS modular services for HRMS, attendance, payroll, recruitment, sales, tracking, location, performance, permissions, and workflow automation.
- Intelligence Layer: AI insights service + analytics service + event capture pipeline.
- Data Layer: PostgreSQL (transactional), Redis (cache/session), Elasticsearch (search), TimescaleDB (time-series telemetry), object storage (documents).
- Integration Layer: REST APIs, webhook/event-driven workflows, optional GraphQL façade.

### 1.2 Core Runtime Flow
1. User logs in via `/api/v1/auth/login` and receives JWT.
2. Frontend sends JWT in `Authorization` header for secure API calls.
3. API gateway path routing is handled by NestJS module controllers.
4. `JwtAuthGuard + RolesGuard` validates identity and role permission.
5. Services return operational data and trigger automation/audit events.

## 2. Microservices Architecture

### 2.1 Operational Services
- `auth-service`: login, token issuance, auth context.
- `user-service`: user identity and profile management.
- `company-service`: tenant/company setup and controls.
- `employee-service`: employee master profile lifecycle.
- `attendance-service`: attendance records, shifts, workdays.
- `leave-service`: leave requests, leave types, approvals.
- `payroll-service`: salary generation, deductions, bonus handling.
- `recruitment-service`: jobs, candidates, applications, ATS flow.
- `sales-automation-service`: leads, deals, targets, commissions.
- `document-center-service`: letters, certificates, slips, cards.
- `employee-services-service`: ticketing and employee request flow.
- `workflow-automation-service`: event-driven workflow execution.
- `analytics-service`: BI, events, and dashboard KPIs.
- `ai-engine-service`: prediction and recommendation endpoints.
- `notification-service`: operational alerts and updates.
- `billing-service`: subscription and invoice lifecycle.

### 2.2 Office Portal Expansion Services
- `permission-control-service`: role permission matrix + audit logs.
- `work-tracking-service`: login/logout/task productivity telemetry.
- `location-tracking-service`: GPS/geofence/WFH/field snapshots.
- `performance-management-service`: performance scorecards and team leaderboard.
- `task-management-service`: assignment, deadlines, project completion.

## 3. Role Based Access Control (RBAC)

### 3.1 Roles
- Platform Super Admin (`platform-admin`)
- Company Admin (`company-admin`)
- HR Manager (`hr-manager`)
- Team Manager (`team-manager`)
- Team Leader (`team-leader`)
- Sales Manager (`sales-manager`)
- Recruiter (`recruiter`)
- Employee (`employee`)
- Guest (`guest`)

### 3.2 Permission Model
- View scope: all/company/team/self/restricted-read.
- Edit scope: global/company/department/team/self/none.
- Approve scope: global/company/hr/team/none.
- Report scope: executive/org/team/self/read-only.
- Data scope: row-level by tenant + optional department filters.

### 3.3 Governance Rules
- Least-privilege by default.
- Permission grants/revokes are auditable events.
- Sensitive modules require elevated roles + audit logging.
- Guest access is read-only and explicitly scoped.

## 4. Database Schema (Core Tables)

### 4.1 Identity and Access
- `users(id, tenant_id, email, password_hash, full_name, role, is_active, created_at)`
- `roles(id, code, name, hierarchy_level, is_system)`
- `permissions(id, permission_key, module, action)`
- `role_permissions(id, role_id, permission_id, allow)`
- `user_overrides(id, user_id, permission_id, allow, expires_at)`

### 4.2 Organization and Workforce
- `companies(id, name, industry, country, timezone, status)`
- `employees(id, tenant_id, employee_code, user_id, department, designation, manager_id, status)`
- `attendance(id, employee_id, attendance_date, check_in_at, check_out_at, status, shift_code)`
- `workdays(id, employee_id, month_key, present_days, absent_days, paid_leave, unpaid_leave, wfh_days)`
- `locations(id, employee_id, lat, lng, zone_type, status, captured_at)`
- `location_geofences(id, tenant_id, name, polygon, is_active)`

### 4.3 Productivity and Delivery
- `tasks(id, tenant_id, task_name, assignee_id, project_id, priority, status, due_date)`
- `projects(id, tenant_id, name, owner_id, completion_percent, status)`
- `work_activities(id, employee_id, login_at, logout_at, productive_hours, tasks_completed, project_ref)`
- `performance_scores(id, employee_id, period_key, score, target_achievement, ai_score)`

### 4.4 HR Operations
- `payroll(id, employee_id, payroll_month, gross_pay, deductions, net_pay, status)`
- `leave_requests(id, employee_id, leave_type_id, start_date, end_date, status, approved_by)`
- `documents(id, employee_id, document_type, document_name, status, generated_at)`

### 4.5 Security and Audit
- `audit_logs(id, tenant_id, actor_id, action, entity_type, entity_id, payload_json, created_at)`
- `activity_logs(id, tenant_id, user_id, module, event_type, metadata_json, created_at)`
- `notifications(id, tenant_id, user_id, type, title, message, status, created_at)`

## 5. API Endpoint Blueprint

### 5.1 Authentication
- `POST /api/v1/auth/login`

### 5.2 Office Portal (New)
- `GET /api/v1/permission-control/roles`
- `GET /api/v1/permission-control/audits`
- `PATCH /api/v1/permission-control/roles/:id`
- `GET /api/v1/work-tracking/activities`
- `GET /api/v1/work-tracking/workdays`
- `GET /api/v1/location-tracking/current`
- `GET /api/v1/location-tracking/history`
- `GET /api/v1/performance/scores`
- `GET /api/v1/performance/leaderboard`
- `GET /api/v1/tasks`
- `GET /api/v1/tasks/projects`

### 5.3 Existing HRMS/ERP APIs
- Employee, Attendance, Payroll, Recruitment, Documents, Services, Analytics, Sales Automation, Workflow, Notifications, Marketplace modules under `/api/v1/...`.

## 6. Frontend Dashboard Design System

### 6.1 Shared UX
- Unified top nav + side nav.
- Role switcher with RBAC-aware modules.
- Live status badge (`API Connected` / `Fallback`).
- Shared route banner with module-specific visuals.

### 6.2 Dashboard Inventory
- Existing: Dashboard, Employees, Attendance, Payroll, Sales, Recruitment, Documents, Services, Analytics, Automation, Marketplace, Settings.
- New: Tracking, Tasks, Location, Performance, Permissions.

### 6.3 Employee Portal Widgets
- Attendance status + workday summary.
- Assigned tasks + due deadlines.
- Performance score + target trajectory.
- Salary forecast + document access.
- Notifications + approval statuses.

## 7. Security & Compliance
- JWT-based authentication and role guards on protected APIs.
- RBAC permissions aligned with module responsibilities.
- Audit logs for permission and critical state changes.
- Sensitive data access controlled by tenant and role scope.
- CORS controls + secured API headers.

## 8. Scalability and Production Readiness
- Horizontal service scaling via Kubernetes deployments.
- Dedicated autoscaling for high-traffic modules (attendance, analytics, notifications).
- Caching and queueing for heavy read/write bursts.
- Multi-region deployment and DR strategy.
- CI/CD with infra as code (Terraform) and service health SLO monitoring.
