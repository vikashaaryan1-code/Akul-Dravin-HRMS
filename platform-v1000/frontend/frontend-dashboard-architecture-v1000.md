# Frontend Dashboard Architecture (v1000.0)

## Technology baseline
- Next.js (App Router) + React + TypeScript + TailwindCSS.
- Design system with role-aware components and theme tokens.
- SSR + edge caching for high-traffic dashboard views.

## Frontend app structure
```text
frontend/
  apps/
    web/
      app/
        (auth)/
          login/
          sso/
          forgot-password/
        (platform-admin)/
        (company-admin)/
        (hr-manager)/
        (recruiter)/
        (employee)/
        (job-seeker)/
        marketplace/
        ai-assistant/
      components/
        layout/
        dashboard/
        charts/
        payroll/
        documents/
        workflows/
      features/
        auth/
        employee/
        attendance/
        leave/
        payroll/
        recruitment/
        marketplace/
        documents/
        analytics/
      lib/
        api-client/
        auth/
        rbac/
        utils/
      styles/
        globals.css
        tokens.css
```

## Role dashboards
1. Platform Admin
- tenant health, infra status, security alerts, global billing and SLA dashboards.

2. Company Admin
- org setup, policies, subscription controls, workforce and finance snapshots.

3. HR Manager
- employee lifecycle, attendance, leave approvals, payroll run monitor, document approvals.

4. Recruiter
- job pipeline board, candidate ranking, interview slots, placement and commission views.

5. Employee
- profile, attendance, leave, payslip, targets, benefits, service enrollments.

6. Job Seeker
- profile builder, job discovery, application tracker, interview status.

## Navigation model
- Top-level shell with role-based route guards.
- Left nav: module menu by scope and plan.
- Context nav: module-level actions.
- Global command palette for quick workflow actions.

## UX architecture standards
- Feature flags for plan-gated modules.
- Offline-friendly mobile workflows for attendance and approvals.
- Accessibility baseline: keyboard-first, WCAG contrast, ARIA patterns.
