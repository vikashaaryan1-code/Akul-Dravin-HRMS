# 05. Frontend and Mobile Architecture

## Web Platform
- Framework: Next.js + React + TypeScript + Tailwind CSS
- Rendering:
  - SSR for SEO/public job marketplace
  - RSC for dashboard payload optimization
  - ISR for marketing and documentation sections
- State:
  - Query cache (React Query/Apollo)
  - Auth/session context
  - Feature-flag driven navigation by role and plan

## Mobile Platform
- React Native app with module federation style domain bundles:
  - Employee self-service (attendance, leave, payslips)
  - Recruiter workflows (pipeline, scheduling)
  - Candidate workflows (jobs, applications)
- Offline-first sync for attendance and approvals.
- Push notifications for approvals, interviews, and payroll alerts.

## Role Dashboards
- Platform Admin
- Company Admin
- HR Manager
- Recruiter
- Employee
- Job Seeker

## Design System
- Tokenized theming for white-label partners.
- Accessibility baseline WCAG 2.2 AA.
- i18n-ready copy keys and RTL-safe layouts.
