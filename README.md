# AKUL DRAVIN BUSINESS OPERATING SYSTEM (Unified Workspace)

This repository contains two frontend stacks:

- `frontend-next/` (primary): Next.js enterprise platform with role-based dashboards and all modules.
- `src/` (legacy): Vite dashboard from earlier iterations.

The default root commands now run the unified Next.js platform.

## Quick Start (Single App)

1. Install dependencies:

```bash
npm install
npm --prefix frontend-next install
npm --prefix backend/hrms-microservices install
```

2. Start unified frontend + backend:

```bash
npm run dev
```

3. Open:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4200/api/v1`

## Primary Commands

- `npm run dev` - Next.js frontend + NestJS microservices backend
- `npm run dev:frontend` - only Next.js frontend
- `npm run dev:backend` - only NestJS microservices backend
- `npm run build` - build frontend-next and backend microservices
- `npm run preview` - start Next.js production server (after build)

## Legacy Commands

- `npm run dev:legacy` - old Vite frontend + old Node backend
- `npm run dev:frontend:legacy` - old Vite frontend only
- `npm run dev:backend:legacy` - old Node backend only
- `npm run build:legacy` - old Vite build
- `npm run preview:legacy` - old Vite preview

## Environment

`frontend-next` uses:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4200/api/v1
```

Create `frontend-next/.env.local` if you want to override it.

## Job Board Feature

The platform includes a complete job board system with:

- **Public job listings** on the homepage
- **Application flow** with authentication
- **Admin dashboard** for job management
- **Application review system** for HR
- **Webhook API** for automatic job posting

### Seed Sample Jobs

To populate the job board with sample data:

```bash
cd backend/hrms-microservices
node seed-jobs.js
```

Then visit `http://localhost:3000` to see jobs on the homepage.

### Documentation

- **Complete Guide:** [JOB_BOARD_FEATURE.md](JOB_BOARD_FEATURE.md)
- **Webhook API:** [WEBHOOK_API_DOCUMENTATION.md](WEBHOOK_API_DOCUMENTATION.md)

### Quick Test

1. Visit homepage and click "Apply Now" on any job
2. Login or create account
3. Fill application form and submit
4. Login as admin and navigate to "Job Applications"
5. Review and manage applications
