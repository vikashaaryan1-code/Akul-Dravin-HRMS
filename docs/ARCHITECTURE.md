# AKUL DRAVIN HRMS AI - System Architecture

## Overview
AKUL DRAVIN HRMS AI is a next-generation Sovereign AI Operating System built for Enterprise Human Resource Management. The platform is designed around strict deterministic financial ledgers, 3D glassmorphism frontend aesthetics, and the "Node 8 Autonomous Engine" for self-regulating business logic.

## High-Level Architecture
The system employs a decoupled, microservices-oriented backend paired with a highly dynamic React-based frontend.

1. **Frontend (Next.js 15)**: 
   - A highly performant, server-rendered and statically optimized React frontend.
   - Utilizes TailwindCSS with a custom **Premium Light Theme (3D Glassmorphism)** utilizing colors like Navy, Gold, Aqua/Cyan, Ember, and Jade.
   - Built with advanced layout routing (`src/app`).
2. **Backend (NestJS Microservices)**: 
   - A modular monolithic architecture powered by NestJS.
   - Features robust modules for `AiEngine`, `Employee`, `Payroll`, `Finance`, `DocumentCenter`, and more.
   - Utilizes `forwardRef` injection to elegantly resolve circular dependencies between tightly coupled business domains (e.g., AI Engine & Payroll).
3. **Database (Prisma / PostgreSQL)**:
   - Type-safe data access via Prisma ORM.
   - Focus on deterministic ledgers with Zero-Sum invariants for absolute truth in financial and payroll reporting.

## Core Modules (Node 8 Autonomous Engine)

- **AI Engine (`AiEngineModule`)**: 
  The intelligence layer responsible for generating insights, handling chatbots, and self-correcting drift across the organization. It integrates deeply with all other modules.
  
- **Payroll & Finance (`PayrollModule`, `FinanceModule`)**: 
  Enforces cryptographic non-repudiation. Operates a deterministic financial ledger ensuring that every transaction is a non-repudiable event protected by double-entry invariants.

- **Employee Management (`EmployeeModule`)**: 
  The source of truth for the organization's workforce. Supports comprehensive lifecycle management from onboarding to offboarding.

- **Document Center (`DocumentCenterModule`)**: 
  A secure repository generating dynamic templates, digital watermarks, and verification endpoints using standard `.akuldravin.com` signatures.

## Security & Compliance
- Cryptographic payload signing.
- Role-based and Feature-based subscription gating across 7 pricing tiers (Free to Enterprise).
- Forensic Traceability with Correlated TraceIDs across API logs.

## Deployment Guidelines
- **Frontend**: Deployable via Vercel or any Node.js hosting platform (`npm run build && npm run start`).
- **Backend**: Containerizable via Docker. Ensure environmental variables for DB connection and AI API keys are securely injected.
