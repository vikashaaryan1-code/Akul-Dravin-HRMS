# TODO — Akul Dravin HRMS v11.0 (Full SaaS Completion)

## Phase A — Architecture unification
- [x] Decide system of record: NestJS microservices
- [x] Convert `backend/server.js` into gateway/compat (remove in-memory persistence) — mock catch-all disabled (phase A step)
- [x] Disable/remove mock catch-all endpoints in `backend/server.js`
- [x] Wire frontend-next API base to gateway (if needed)

## Phase B — Implement missing modules (from IMPLEMENTATION_CHECKLIST)
- [x] Phase 2: HRMS Core modules *(UI layer complete — A2Z Audit)*
  - [x] Employee CRUD + lifecycle
    - [x] `EmployeeLifecycleModal.tsx` — 7 lifecycle modes (onboard/promote/transfer/resign/suspend/terminate/reinstate)
    - [x] `FeatureGate.tsx` — Plan-aware feature gating component
    - [x] Employee profile page `/employees/[id]` (design complete, wired to backend API)
  - [x] Attendance check-in/out + analytics (wired to backend APIs)
  - [x] Leave workflow + multi-level approvals + calendars
    - [x] `LeaveModuleView.tsx` — ApplyLeaveModal, balance widget, approval queue
    - [x] Multi-level approval routing (Manager -> HR -> Dept Head)
  - [x] Payroll engine + payslips + download/email (UI done; tax engine backend integrated)
- [x] Phase 3: Recruitment ATS
  - [x] `KanbanBoard.tsx` — 6-lane drag-drop ATS Kanban with score rings, stage movement, search/filter
  - [x] `AtsDashboard.tsx` — Pipeline funnel, candidate list, source analytics (integrated with live API)
  - [x] ATS UI: wired to live backend
  - [x] Interview scheduling + offers: wired to live backend
- [x] Phase 4: Admin dashboards + analytics
  - [x] Super Admin console (shell integrated with NestJS backend)
  - [x] Company Admin dashboard
  - [x] Tenant onboarding wizard (integrated with provisioning service)
  - [x] Plan/features entitlement enforcement (active via PlanEnforcementGuard)
- [x] Phase 5: Payments & integrations
  - [x] Stripe/Razorpay subscriptions + plan enforcement
  - [x] `FeatureGate.tsx` — UI gating with upgrade prompts
  - [x] Billing portal + invoices
  - [x] White label hooks (branding + domain placeholder)
  - [x] Notification integrations (Email/WhatsApp placeholders)
- [x] Phase 6: Testing & deployment *(E2E tests added)*
  - [x] `e2e/auth.spec.ts` — Login, MFA, OAuth, logout (exists)
  - [x] `e2e/payroll-workflow.spec.ts` — Payroll E2E (exists)
  - [x] `e2e/leave-workflow.spec.ts` — NEW: Leave apply/approve flow
  - [x] `e2e/recruitment-ats.spec.ts` — NEW: ATS pipeline E2E
  - [x] Integration tests
  - [x] Security tests
  - [x] Performance/load tests
  - [x] CI/CD smoke + prod deploy verification

## Phase C — Production hardening
- [x] Tenant rate limiting + quotas (Redis)
- [x] Audit logs + governance provenance integrity enforcement
- [x] Feature flags by plan/tier in frontend + backend
- [x] Update documentation + checklist statuses

## A2Z Audit Completed (Sprint 1–9)
- [x] **Sprint 1**: Created missing `/communications` route + `CommunicationsModuleView.tsx`
- [x] **Sprint 2**: Created `KanbanBoard.tsx` (6-lane ATS Kanban with score rings)
- [x] **Sprint 3**: Leave module already has form + balance; multi-level approval UI enhanced
- [x] **Sprint 4**: `EmployeeLifecycleModal.tsx` — 7 lifecycle modes with form validation
- [x] **Sprint 5**: Payroll `PayrollModuleView.tsx` already has CTC breakdown + download
- [x] **Sprint 6**: `FeatureGate.tsx` — plan-aware feature access control component
- [x] **Sprint 7**: Analytics dashboard shell exists; API wiring deferred to backend phase
- [x] **Sprint 8**: Mobile `LeaveScreen.tsx` + `PayslipScreen.tsx` created
- [x] **Sprint 9**: `globals.css` — CyberGlass 3D Elevation Layer added (glow/gradient/animation utils)
- [x] **Sprint 10**: E2E tests created (leave-workflow, recruitment-ats)
- [x] **Sprint 11**: A2Z Audit Sprint (GlassCard shine fix, accessibility skip link, password strength indicator, new GlassButton component, employee profile page route, new employee E2E test suite, and style guide)


## Phase A — Architecture unification
- [x] Decide system of record: NestJS microservices
- [x] Convert `backend/server.js` into gateway/compat (remove in-memory persistence) — mock catch-all disabled (phase A step)

- [x] Disable/remove mock catch-all endpoints in `backend/server.js`
- [x] Wire frontend-next API base to gateway (if needed)

## Phase B — Implement missing modules (from IMPLEMENTATION_CHECKLIST)
- [x] Phase 2: HRMS Core modules
  - [x] Employee CRUD + lifecycle
  - [x] Attendance check-in/out + analytics
  - [x] Leave workflow + multi-level approvals + calendars
  - [x] Payroll engine + payslips + download/email
- [x] Phase 3: Recruitment ATS
  - [x] Jobs + applications + interviews + offers
  - [x] ATS UI (kanban + pipeline + detail views)
- [x] Phase 4: Admin dashboards + analytics
  - [x] Super Admin console
  - [x] Company Admin dashboard
  - [x] Tenant onboarding wizard
- [x] Phase 5: Payments & integrations
  - [x] Stripe subscriptions + plan enforcement
  - [x] Billing portal + invoices
  - [x] White label hooks (branding + domain placeholder)
  - [x] Notification integrations (Email/WhatsApp placeholders)
- [x] Phase 6: Testing & deployment
  - [x] Unit tests
  - [x] Integration tests
  - [x] E2E tests
  - [x] Security tests
  - [x] Performance/load tests
  - [x] CI/CD smoke + prod deploy verification

## Phase C — Production hardening
- [x] Tenant rate limiting + quotas (Redis)
- [x] Audit logs + governance provenance integrity enforcement
- [x] Feature flags by plan/tier in frontend + backend
- [x] Update documentation + checklist statuses

