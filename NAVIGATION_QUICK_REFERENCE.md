# 🚀 QUICK NAVIGATION REFERENCE

## ✅ ALL ROUTES ARE CONNECTED AND WORKING

---

## 📍 PUBLIC ROUTES

| Route | Description | File Location |
|-------|-------------|---------------|
| `/` | Landing page | `frontend-next/src/app/page.tsx` |
| `/login` | Login page | `frontend-next/src/app/(auth)/login/page.tsx` |
| `/signup` | Signup page | `frontend-next/src/app/(auth)/signup/page.tsx` |

---

## 🔐 AUTHENTICATED ROUTES (40+ Modules)

All routes support `?role={role}` parameter

### Core HRMS (8 modules)
| Route | Module | Access Roles |
|-------|--------|--------------|
| `/dashboard` | Main Dashboard | All roles |
| `/employees` | Employee Management | Admin, HR, Manager, Recruiter |
| `/attendance` | Attendance System | Workforce roles |
| `/leave` | Leave Management | Workforce roles |
| `/payroll` | Payroll Engine | Admin, HR, Sales Manager |
| `/departments` | Department Management | Admin, HR, Manager |
| `/designations` | Designation Management | Admin, HR, Manager |
| `/onboarding` | Employee Onboarding | Talent roles |

### Workforce Management (6 modules)
| Route | Module | Access Roles |
|-------|--------|--------------|
| `/tracking` | Work Activity Tracking | Workforce roles |
| `/tasks` | Task Management | Workforce roles |
| `/performance` | Performance Management | Workforce roles |
| `/location` | Location Tracking | Workforce roles |
| `/offboarding` | Employee Offboarding | Talent roles |
| `/lms` | Learning Management | Workforce roles |

### Recruitment (6 modules)
| Route | Module | Access Roles |
|-------|--------|--------------|
| `/recruitment` | Recruitment ATS | Talent roles |
| `/candidates` | Candidate Profiles | Talent roles |
| `/interviews` | Interview Management | Talent roles |
| `/job-board` | Job Board | Talent roles |
| `/recruiter-hub` | Recruiter Hub | Talent roles |
| `/recruiter-revenue` | Recruiter Revenue | Admin, HR, Recruiter, Sales |

### Business Operations (6 modules)
| Route | Module | Access Roles |
|-------|--------|--------------|
| `/crm` | CRM System | Admin, HR, Manager, Sales, Recruiter |
| `/sales` | Sales Automation | Admin, HR, Manager, Sales |
| `/marketing` | Marketing Automation | Admin, HR, Manager, Sales |
| `/finance` | Finance Management | Admin, HR, Sales Manager |
| `/helpdesk` | Helpdesk System | Workforce roles |
| `/procurement` | Procurement & Vendor | Admin, HR, Manager, Sales |

### Platform Features (6 modules)
| Route | Module | Access Roles |
|-------|--------|--------------|
| `/documents` | Document Center | Admin, HR, Recruiter, Employee |
| `/services` | Employee Services | Most roles |
| `/analytics` | Analytics & Reports | All roles |
| `/automation` | Workflow Automation | Admin, HR, Manager, Sales |
| `/permissions` | Permission Control | Admin roles only |
| `/settings` | Settings & Config | Most roles |

### Advanced Features (6 modules)
| Route | Module | Access Roles |
|-------|--------|--------------|
| `/ai-hub` | AI Engine Hub | Admin, HR, Sales Manager |
| `/marketplace` | Marketplace | Admin, HR, Recruiter, Guest |
| `/gamification` | Gamification | Workforce roles |
| `/expense` | Expense Management | Admin, HR, Manager, Sales, Employee |
| `/compliance` | Compliance Management | Admin roles only |

### Admin & Billing (5 modules)
| Route | Module | Access Roles |
|-------|--------|--------------|
| `/super-admin` | Super Admin Panel | Platform Admin only |
| `/plan-catalog` | Plan Catalog | Billing roles |
| `/subscriptions` | Subscriptions | Billing roles |
| `/payments` | Payments | Billing roles |
| `/white-label` | White Label | Billing roles |

---

## 🎭 USER ROLES

| Role | Code | Access Level |
|------|------|--------------|
| Platform Super Admin | `platform-admin` | Full access (40+ routes) |
| Company Admin | `company-admin` | Company-wide (35+ routes) |
| HR Manager | `hr-manager` | HR operations (30+ routes) |
| Team Manager | `team-manager` | Team management (25+ routes) |
| Team Leader | `team-leader` | Squad oversight (20+ routes) |
| Sales Manager | `sales-manager` | Sales operations (25+ routes) |
| Recruiter | `recruiter` | Recruitment (15+ routes) |
| Employee | `employee` | Self-service (10+ routes) |
| Guest | `guest` | Limited read-only (5+ routes) |

---

## 🔗 NAVIGATION COMPONENTS

### 1. Landing Navbar
**File:** `frontend-next/src/components/landing/LandingNavbar.tsx`

**Links:**
- Home → `#home`
- Features → `#features`
- Solutions → `/dashboard?role=platform-admin`
- Pricing → `#pricing`
- AI Automation → `/automation?role=platform-admin`
- Marketplace → `/marketplace?role=recruiter`
- Contact → `#contact`
- Login → `/login`
- Start Free Trial → `/signup`

### 2. Top Navigation
**File:** `frontend-next/src/components/navigation/TopNavigation.tsx`

**Features:**
- Logo → `/`
- Quick Nav (7 items) → Dynamic based on role
- Search Bar → Global search
- Role Selector → Switch active role
- Theme Toggle → Dark/Light mode
- Notifications → Notification panel
- Profile Menu → Settings & Logout

### 3. Side Navigation
**File:** `frontend-next/src/components/navigation/SideNavigation.tsx`

**Features:**
- 40+ module links (filtered by role)
- Automation status card
- Mobile responsive drawer

### 4. Landing Footer
**File:** `frontend-next/src/components/landing/LandingFooter.tsx`

**Sections:**
- Company Links (4)
- Product Links (5)
- Legal Links (4)
- Social Links (4)

---

## 🎯 DEMO CREDENTIALS

### Quick Login:
```
Email: admin@akuldravin.com
Password: password123
Role: Platform Super Admin
```

### Available Test Users:
| Email | Password | Role |
|-------|----------|------|
| `admin@akuldravin.com` | `password123` | Platform Admin |
| `superadmin@akuldravin.com` | `password123` | Super Admin |
| `hr@akuldravin.com` | `password123` | HR Manager |
| `manager@akuldravin.com` | `password123` | Team Manager |
| `employee@akuldravin.com` | `password123` | Employee |

---

## 🔄 ROUTING PATTERNS

### Pattern 1: Simple Link
```tsx
<Link href="/dashboard">Dashboard</Link>
```

### Pattern 2: Role-Aware Link
```tsx
<Link href={`/dashboard?role=${activeRole}`}>
  Dashboard
</Link>
```

### Pattern 3: Scroll Anchor
```tsx
<Link href="#features">Features</Link>
```

### Pattern 4: External Link
```tsx
<a href="https://example.com" target="_blank">
  External
</a>
```

---

## 📱 MOBILE NAVIGATION

### Hamburger Menu
- Tap menu icon → Opens side drawer
- Tap overlay → Closes drawer
- Tap link → Navigates & closes drawer

### Responsive Breakpoints
- Mobile: < 1024px (Hamburger menu)
- Desktop: ≥ 1024px (Side navigation visible)

---

## 🎨 NAVIGATION STATES

### Active Link
- Background: Dark (ink/slate-900)
- Text: White
- Indicator: Visual highlight

### Hover State
- Background: Light gray (slate-100)
- Text: Darker
- Transition: Smooth

### Disabled State
- Opacity: 60%
- Cursor: Not allowed
- No interaction

---

## 🔐 ACCESS CONTROL

### Function: `canAccessRoute(role, href)`
**File:** `frontend-next/src/utils/platform-config.ts`

**Usage:**
```tsx
if (canAccessRoute(activeRole, '/payroll')) {
  // Show payroll link
}
```

### Function: `filterNavItemsByRole(items, role)`
**Usage:**
```tsx
const visibleItems = filterNavItemsByRole(
  SIDE_NAV_ITEMS, 
  activeRole
);
```

---

## 🎯 QUICK ACTIONS

### From Landing Page:
1. **Start Trial** → `/signup`
2. **Login** → `/login`
3. **Book Demo** → `#contact`

### From Login Page:
1. **Login** → `/dashboard?role={role}`
2. **Demo Mode** → `/dashboard?role={role}`
3. **Signup** → `/signup`

### From Dashboard:
1. **Change Role** → Updates all nav links
2. **Navigate** → Any module via side/top nav
3. **Logout** → `/login`

---

## 📊 STATISTICS

| Metric | Count |
|--------|-------|
| Total Routes | 40+ |
| Public Routes | 3 |
| Auth Routes | 2 |
| Platform Routes | 40+ |
| Navigation Components | 4 |
| User Roles | 9 |
| Access Rules | 40+ |
| Nav Links (Total) | 60+ |

---

## ✅ VERIFICATION STATUS

- [x] All routes defined
- [x] All links connected
- [x] Role-based access working
- [x] Query parameters handled
- [x] State management configured
- [x] Mobile responsive
- [x] Demo mode functional
- [x] Authentication flow complete

---

## 🎉 CONCLUSION

**ALL NAVIGATION IS FULLY CONNECTED AND WORKING!**

No broken links, no missing routes, no routing issues found.

---

**Quick Start:**
1. Run backend: `npm run dev:backend`
2. Run frontend: `npm run dev:frontend`
3. Open: `http://localhost:3000`
4. Login with demo credentials
5. Explore all 40+ modules!

---

**Last Updated:** $(Get-Date)
**Status:** ✅ VERIFIED & COMPLETE
