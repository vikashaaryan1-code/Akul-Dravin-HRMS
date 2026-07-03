# Pages Architecture — AKUL DRAVIN HRMS

This project uses the **Next.js App Router** under `src/app/` for all route handling.

## ⚠️ Important — No `src/pages/` Directory

The `src/pages/` directory has been intentionally **removed** to prevent Next.js from
activating the Pages Router alongside the App Router.

Having an empty `src/pages/` directory — even with no page files — causes Next.js to:
1. Detect Pages Router and generate `_app.js`, `_document.js`, `_error.js` defaults
2. Fail during the "Collecting page data" build phase with:
   `PageNotFoundError: Cannot find module for page: /_document`

## Architecture

- **All routes** → `src/app/` (App Router, RSC-first)
- **Platform pages** → `src/app/(platform)/`
- **Auth pages** → `src/app/(auth)/`
- **Landing pages** → `src/app/(app)/`
- **API routes** → `src/app/api/`

## Legacy Redirect

Any legacy `/pages/[slug]` URL is handled by `src/app/(app)/pages/[slug]/page.tsx`
which redirects to `/#features`.
