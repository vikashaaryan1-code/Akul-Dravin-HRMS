# CHANGELOG — Akul Dravin HRMS v11.0

All notable changes to this project are documented here.
Format: [Semantic Versioning](https://semver.org/) · [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [11.0.10] — 2026-07-01 · A2Z Audit Sprint

### 🔧 Bug Fixes

#### `GlassCard.tsx` — Critical Shine Overlay Bug
- **FIXED**: `group-hover:opacity-100` on the shine overlay div was never triggered because the parent `<Tag>` element did not carry the Tailwind `group` class. The shine effect was dead code.
- **FIX**: Replaced CSS `group-hover` approach with a React state variable `isHovered` toggled via `onMouseEnter`/`onMouseLeave` events. Shine now correctly follows the mouse position and fades in/out.
- **Impact**: Previously, all 3D GlassCard components showed no shine effect on hover. Now they respond correctly.

#### `GlassCard.tsx` — Missing prefers-reduced-motion Support
- **FIXED**: The 3D tilt mouse-move handler executed regardless of the user's motion preferences.
- **FIX**: Added `window.matchMedia('(prefers-reduced-motion: reduce)').matches` guard inside `handleMouseMove`. On reduced-motion systems, cards render statically.
- **WCAG**: Satisfies WCAG 2.1 SC 2.3.3 (Animation from Interactions).

#### `GlassCard.tsx` — Missing Keyboard Accessibility
- **FIXED**: Clickable cards had `onClick` but no `role`, `tabIndex`, `aria-label`, or `onKeyDown` handler.
- **FIX**: When `onClick` is provided, card now receives `role="button"`, `tabIndex={0}`, and `onKeyDown` that fires on `Enter`/`Space`.
- **WCAG**: Satisfies WCAG 2.1 SC 4.1.2 (Name, Role, Value).

---

### ✨ New Features

#### `GlassButton.tsx` — New Premium Interactive Button Component
- **NEW**: `GlassButton` component with 7 variants (`primary`, `secondary`, `ghost`, `danger`, `gold`, `aqua`, `jade`).
- **Features**: 5 sizes, loading spinner, left/right icon slots, magnetic hover micro-animation, active press scale, shimmer top-rim highlight, prefers-reduced-motion support.
- **Accessibility**: Correctly disabled state (`aria-disabled` pattern), keyboard-operable.

#### `layout.tsx` — Skip to Main Content Accessibility Link
- **NEW**: Added `<a href="#main-content">` as the first child of `<body>`.
- **Visible**: Normally `sr-only` (screen-reader only); becomes fully visible with brand-gold styling on keyboard focus.
- **WCAG**: Satisfies WCAG 2.1 SC 2.4.1 (Bypass Blocks). Critical for keyboard and screen-reader users navigating the platform.

#### `signup/page.tsx` — Password Strength Indicator
- **NEW**: Real-time password strength meter below the password input field.
- **Scoring**: 5 criteria (length≥8, length≥12, mixed case, number, symbol) → score 0–4 mapped to Too Weak / Weak / Fair / Good / Strong.
- **Visual**: 4-segment color bar (red→orange→amber→lime→emerald) + text label.
- **Accessibility**: `role="status"` + `aria-live="polite"` for screen-reader announcements.

#### `EmployeeProfileView.tsx` — New Employee Profile Component (P0 Gap)
- **NEW**: Full-featured `EmployeeProfileView` component for the `/employees/[id]` route.
- **Sections**: Hero card (avatar, status badge, contact info, skills), KPI row (performance/attendance/CTC/leave balance), tab interface (Overview/Payroll/Documents/Timeline), career timeline, leave balance progress bars, document vault with download buttons, security compliance footer.
- **Design**: Uses `GlassCard` throughout with cinematic elevation system.
- **Note**: Currently uses mock data pending backend wiring.

#### `/employees/[id]/page.tsx` — Employee Profile Route (P0 Gap)
- **NEW**: Next.js App Router dynamic route `/employees/[id]`.
- **Status**: Route scaffolded with proper async params handling (Next.js 15 pattern).

---

### 🎨 Design System Enhancements

#### `globals.css` — Cinematic Glass Enhancement Layer (300+ LOC)
- **NEW**: `ambient-orb` system — 4 accent-colored floating orbs with `ambient-drift` animation.
- **NEW**: `glass-shimmer` utility — sweeping light reflection animation on glass surfaces.
- **NEW**: Cinematic entrance animations: `animate-fade-up`, `animate-fade-in-scale`, `animate-slide-in-right`, `animate-reveal-up`.
- **NEW**: Stagger delay helpers: `.delay-100` through `.delay-800`.
- **NEW**: `mesh-bg` — 4-axis radial gradient mesh background for cinematic depth.
- **NEW**: Glass elevation scale: `.glass-elevation-0` through `.glass-elevation-4` (blur, bg opacity, shadow system).
- **NEW**: `.hover-card-cinematic` — spring-animated card lift + shadow intensification.
- **NEW**: Neon text glow: `.text-glow-gold`, `.text-glow-aqua`, `.text-glow-ember`, `.text-glow-jade`, `.text-glow-white`.
- **NEW**: `.glass-input:focus` — brand-gold focus ring with inset highlight.
- **NEW**: `.skeleton` loading state utility with shimmer animation.
- **NEW**: `.parallax-container`, `.parallax-layer-slow`, `.parallax-layer-fast` 3D parallax helpers.
- **ENHANCED**: Mobile responsive glass: reduced backdrop blur on `max-width: 640px` for performance.
- **ENHANCED**: Typography responsive: fluid `h1`/`h2` `clamp()` values at 768px breakpoint.
- **ENHANCED**: `prefers-reduced-motion` now uses complete `*` override with `0.01ms` duration + specific class resets.
- **NEW**: `#main-content` scroll-margin-top for skip link target.

---

### 🧪 Testing

#### `e2e/employees.spec.ts` — New E2E Test Suite (Sprint 3 Gap)
- **NEW**: 14 E2E tests covering employee management:
  - Employees list page load
  - Search input functionality
  - Profile page rendering
  - Hero card visibility
  - KPI cards (all 4 visible)
  - Tab navigation (all 4 tabs)
  - Documents tab content
  - Timeline tab content
  - Back button navigation
  - Skip link accessibility
  - Edit button `aria-label`
  - Mobile viewport (375×812)
  - Tablet viewport (768×1024)
  - Graceful error for invalid employee ID

---

### 📋 Audit Results

Full audit findings catalogued in `implementation_plan.md`:
- **24 action items** identified across P0/P1/P2 priorities
- **P0 critical fixes**: 5 items (shine overlay ✅, skip link ✅, password strength ✅, `/employees/[id]` ✅, color contrast ⬜)
- **P1 high priority**: 7 items (GlassButton ✅, ATS backend ⬜, analytics API ⬜, subscription billing ⬜, super admin ⬜, interview scheduling ⬜, CSP headers ⬜)
- **P2 medium priority**: 8 items (white label ⬜, notifications ⬜, integration tests ⬜, security tests ⬜, load tests ⬜, CI/CD ⬜, mobile screens ⬜, more docs ⬜)

---

## [11.0.9] — Previous Sprint (A2Z Sprint 10)

### Added
- E2E tests: `leave-workflow.spec.ts` + `recruitment-ats.spec.ts`
- `globals.css` — CyberGlass 3D Elevation Layer (glow/gradient/animation utils)

## [11.0.8] — A2Z Sprint 9

### Added
- Mobile: `LeaveScreen.tsx` + `PayslipScreen.tsx` (React Native)

## [11.0.7] — A2Z Sprint 8

### Added
- Analytics dashboard shell

## [11.0.6] — A2Z Sprint 7

### Added
- `FeatureGate.tsx` — plan-aware feature access control

## [11.0.5] — A2Z Sprint 6

### Added
- `PayrollModuleView.tsx` — CTC breakdown + payslip download

## [11.0.4] — A2Z Sprint 5

### Added
- `EmployeeLifecycleModal.tsx` — 7 lifecycle modes with form validation

## [11.0.3] — A2Z Sprint 4

### Added
- Leave module enhancements: multi-level approval UI + balance widget

## [11.0.2] — A2Z Sprint 3

### Added
- `KanbanBoard.tsx` — 6-lane ATS Kanban with score rings + drag-drop

## [11.0.1] — A2Z Sprint 2

### Added
- `/communications` route + `CommunicationsModuleView.tsx`

## [11.0.0] — Foundation Release

### Added
- NestJS microservices backend (40+ modules, 70+ entities)
- AI Engine: 8 layers, 40+ endpoints
- Next.js 15.5 frontend with App Router
- CyberGlass 2.0 design system
- Multi-tenant architecture with JWT + MFA + OAuth
- PostgreSQL + Redis infrastructure
