# TODO — Akul Dravin HRMS v11.0 (Full SaaS Completion)

## Phase A — Architecture unification
- [ ] Decide system of record: NestJS microservices
- [x] Convert `backend/server.js` into gateway/compat (remove in-memory persistence) — mock catch-all disabled (phase A step)

- [ ] Disable/remove mock catch-all endpoints in `backend/server.js`
- [ ] Wire frontend-next API base to gateway (if needed)

## Phase B — Implement missing modules (from IMPLEMENTATION_CHECKLIST)
- [ ] Phase 2: HRMS Core modules
  - [ ] Employee CRUD + lifecycle
  - [ ] Attendance check-in/out + analytics
  - [ ] Leave workflow + multi-level approvals + calendars
  - [ ] Payroll engine + payslips + download/email
- [ ] Phase 3: Recruitment ATS
  - [ ] Jobs + applications + interviews + offers
  - [ ] ATS UI (kanban + pipeline + detail views)
- [ ] Phase 4: Admin dashboards + analytics
  - [ ] Super Admin console
  - [ ] Company Admin dashboard
  - [ ] Analytics dashboard
- [ ] Phase 5: Payments & integrations
  - [ ] Stripe subscriptions + plan enforcement
  - [ ] Billing portal + invoices
  - [ ] White label hooks (branding + domain placeholder)
  - [ ] Notification integrations (Email/WhatsApp placeholders)
- [ ] Phase 6: Testing & deployment
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
  - [ ] Security tests
  - [ ] Performance/load tests
  - [ ] CI/CD smoke + prod deploy verification

## Phase C — Production hardening
- [ ] Tenant rate limiting + quotas (Redis)
- [ ] Audit logs + governance provenance integrity enforcement
- [ ] Feature flags by plan/tier in frontend + backend
- [ ] Update documentation + checklist statuses

