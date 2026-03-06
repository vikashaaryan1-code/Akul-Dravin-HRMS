# 04. Frontend Dashboard Architecture

## Technology Baseline
- Next.js App Router
- React + TypeScript
- TailwindCSS
- Zustand/Redux for global state
- Recharts/Chart.js for analytics
- WebSocket/SSE for realtime updates

## Frontend Structure
```text
frontend-v2000/
  src/
    app/
      (public)/
      (auth)/
      (platform)/
        dashboard/
        employees/
        attendance/
        leave/
        payroll/
        recruitment/
        crm/
        sales/
        marketing/
        finance/
        helpdesk/
        projects/
        inventory/
        vendors/
        procurement/
        documents/
        automation/
        analytics/
        ai-intelligence/
        integrations/
        settings/
    components/
      navigation/
      modules/
      charts/
      ui/
    services/api/
    services/realtime/
    store/
    hooks/
    utils/
```

## Dashboard Types
- Platform Super Admin Dashboard
- Company Owner/Admin Dashboard
- HR Manager Dashboard
- Sales Manager Dashboard
- Team Leader Dashboard
- Employee Self-Service Portal
- Guest Read-only Portal

## Module-to-Dashboard Mapping
- HR: employees, attendance, leave, payroll, recruitment, documents.
- Revenue: crm, sales, marketing.
- Finance: accounting, invoices, expenses, taxes.
- Operations: projects, tasks, inventory, procurement, vendors.
- Support: helpdesk, SLA, customer communication.
- Platform: permissions, automation, integrations, analytics, security.

## Shared UI Building Blocks
- Role-aware top navigation and side navigation.
- Cross-module quick links bar.
- Realtime status chips (live/fallback).
- Generic KPI cards and trend charts.
- Unified table component with server-side paging support.

## State Model
- `auth-store`: session, tenant, role, token lifecycle.
- `ui-store`: theme, nav, active role, feature flags.
- `notification-store`: realtime alerts and read state.
- `module stores`: optional domain-specific states (sales, support, inventory).

## Realtime Channels
- Attendance updates
- Task status changes
- Deal stage changes
- Helpdesk SLA breaches
- Payroll run completion
- Security alerts

## Mobile Super App Scope (React Native)
- Employee attendance and leave
- Task and project updates
- CRM quick actions for sales agents
- Approvals and notifications
- Document wallet (payslip/certificates)

## Accessibility and UX Standards
- WCAG 2.1 AA compliance target.
- Keyboard navigation for all workflow-critical pages.
- Color tokens with contrast-safe theme pairs.
- Internationalization-ready text architecture.

## Current Scaffold in This Repo
- Frontend route scaffold path: `platform-v2000/scaffolds/frontend/src/app/(platform)/*`
