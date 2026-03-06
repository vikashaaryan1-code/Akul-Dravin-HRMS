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
