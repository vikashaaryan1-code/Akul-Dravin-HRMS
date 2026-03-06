# Akul Dravin HRMS AI - Frontend Architecture (Next.js)

## Stack
- Next.js (App Router)
- React
- Tailwind CSS
- TypeScript

## Implemented Deliverables
- UI layout with shared app shell (`TopBar`, role-aware `Sidebar`)
- Dashboard components (`KPI cards`, `AI spotlight`, `quick actions`, `pipeline`, `live feed`)
- Authentication pages (`/login`, `/signup`)
- Role-based dashboards (dynamic route)
- Navigation system by role
- Job marketplace UI
- Candidate profile UI

## Role Dashboards
- `/dashboard/platform-admin`
- `/dashboard/company-admin`
- `/dashboard/hr-manager`
- `/dashboard/recruiter`
- `/dashboard/employee`
- `/dashboard/job-seeker`

## Additional Pages
- `/job-marketplace`
- `/candidate/profile`
- `/login`
- `/signup`

## Folder Structure
```text
frontend-next/
  src/
    app/
      (auth)/
        login/page.tsx
        signup/page.tsx
      (app)/
        dashboard/[role]/page.tsx
        job-marketplace/page.tsx
        candidate/profile/page.tsx
      layout.tsx
      page.tsx
      globals.css
    components/
      layout/
      dashboard/
      marketplace/
      candidate/
    data/
      dashboard-data.ts
      navigation.ts
    lib/
      roles.ts
    types/
      roles.ts
```

## Run
```bash
cd frontend-next
npm install
npm run dev
```

## Notes
- Uses route groups for auth and app sections.
- `dashboard/[role]` validates role slug from shared role config.
- Design system uses warm amber + aqua + ink palette with animated cards.
