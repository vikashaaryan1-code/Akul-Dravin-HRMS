# AKUL DRAVIN HRMS AI 
## Sovereign Enterprise OS & Financial Ledger

AKUL DRAVIN HRMS AI is the world's most advanced, self-regulating human capital and financial platform. Powered by the proprietary **Node 8 Autonomous Engine** and an immutable deterministic ledger, it serves as the ultimate source of truth for global enterprises.

### 🌟 Key Highlights
- **Stunning Aesthetics:** Fully responsive Premium Light Theme utilizing modern 3D Glassmorphism, tailored for the Enterprise (Navy, Gold, Teal, Ember, Jade).
- **7-Tier Enterprise Architecture:** Scales from Free (1-5 Employees) all the way to Custom Enterprise deployments.
- **Node 8 Engine:** Proactive AI assistant that monitors system-wide drift, handles soft quarantine of unstable accounts, and regulates autonomic throttling.
- **Deterministic Ledger:** Absolute truth via strict zero-sum double-entry constraints. Every financial transition is non-repudiable and traceable.

---

## 📚 Project Documentation

Detailed guides have been generated in the `docs/` directory to facilitate a smooth hand-off for architects, admins, and end-users:

1. [**System Architecture (`docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md): Deep dive into the NestJS microservices architecture, Prisma ORM, and the Next.js frontend structure.
2. [**Administrator Manual (`docs/ADMIN_MANUAL.md`)**](./docs/ADMIN_MANUAL.md): Guides on subscription lifecycle management, Role-Based Access Control, and Observability.
3. [**User Manual (`docs/USER_MANUAL.md`)**](./docs/USER_MANUAL.md): How to use the Employee Self Service (ESS), ATS, Payroll, and AI integrations.

---

## 🚀 Quick Start (Production & Development)

The codebase has been stabilized and circular dependencies eliminated for a flawless boot experience.

### 1. Install Global Dependencies
```bash
npm install
npm --prefix frontend-next install
npm --prefix backend/hrms-microservices install
```

### 2. Start the Complete Stack
To spin up both the **NestJS Backend Microservices** and the **Next.js Frontend** concurrently:
```bash
npm run dev
```

### 3. Access the Platform
- **Frontend App (3D Glassmorphism UI):** `http://localhost:3000`
- **Backend API Gateway:** `http://localhost:4200/api/v1`

---

## 🛠 Advanced Commands

- `npm run dev:frontend` - Run only the Next.js UI.
- `npm run dev:backend` - Run only the NestJS backend.
- `npm run build` - Execute a production-ready optimized build for both services.
- `npm run test` - Execute the backend test suite verifying the strict Domain Event Envelopes and Ledger invariants.

---

*AKUL DRAVIN HRMS AI — Transform your workforce administration into an autonomous, self-correcting organism.*
