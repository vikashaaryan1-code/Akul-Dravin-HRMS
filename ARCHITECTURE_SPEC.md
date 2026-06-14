# ARCHITECTURE SPEC: Akul Dravin Institutional Substrate (v1.0-GOVERNED)

**STATUS: ARCHITECTURAL LIFECYCLE CLOSED / SEMANTIC EXHAUSTION**  
**RELEASE: v1.0-GOVERNED**

## 1. Executive Summary
The Akul Dravin HRMS has reached its **Absolute Terminal Equilibrium**. The architectural design space is **Semantically Exhausted**. The system is now a **Closed Event-Sourced Policy Transition Kernel**.

## 2. Irreducible System Model (3-Plane Model)

### 2.1. Execution Plane (Runtime Truth)
- **Invariant**: `S_{t+1} = Γ(C, P_v, S_t)`
- **Primitives**: 
    - **Context Propagation**: `AsyncLocalStorage` scoping of Tenant + Epoch.
    - **Repository Mediation**: All persistence access resolved through `TenantContext`.
    - **Forensic Injection**: Automated provenance binding at the persistence layer (`TenantSubscriber`).
- **Guarantee**: No state mutation exists without a valid, traceable execution frame.

### 2.2. Admission Plane (Pre-Execution Control)
- **Invariant**: Every change must satisfy the bounded policy evaluation function.
- **Primitives**: 
    - **Policy Evaluation DAG**: Terminating, depth-limited evaluation graph.
    - **Violation Taxonomy Engine**: Deterministic classification of architectural drifts.
    - **CI Merge Gating**: Non-trust-based structural authorization.
- **Guarantee**: Only behavioral-compliant intent is allowed to transition from code to production.

### 2.3. Feedback Plane (Cybernetic Control)
- **Invariant**: Policy effectiveness `E` informs the adaptive evolution loop.
- **Primitives**: 
    - **Telemetry Ingestion**: Real-time event and violation monitoring.
    - **Drift Detection**: Identification of rule vs. reality divergence.
    - **Quorum Ratification**: Human-governed decision loop for policy evolution.
- **Guarantee**: Governance evolution is an empirical, evidence-driven process.

## 3. Operational Constraints

### 3.1. Immutability of Primitives
The following components are deemed **TERMINAL** and must not be modified without a formal Governance RFC:
- Persistence Layer Subscriber (`TenantSubscriber.ts`)
- Context Propagation Logic (`TenantContext.ts`)
- Core Database Schema (Provenance Columns)

### 3.2. Observability & Telemetry
- **Analytics Boundary**: The `analytics/*` module is strictly read-only.
- **Economics Telemetry**: Exposes thermodynamic costs (latency, energy, storage) without feedback loops into runtime decisions.

### 3.3. Failure Metabolism
- **Recovery Path**: Quorum-gated rollbacks via `ResilienceService`.
- **Learning Loop**: Postmortem rituals linked to remediation commitments in the audit journal.

## 4. Maintenance Guidelines
Future work must focus exclusively on **Operational Excellence**:
- SLO/SLA management.
- Disaster recovery drills.
- Security hardening.
- Migration rehearsal.

## 5. Context Discipline & Structural Invariants

### 5.1. Prohibition of Direct Persistence Bypasses
To prevent the silent degradation of the forensic substrate, the following patterns are **STRICTLY PROHIBITED**:
- **Bypassing `TenantContext.getRepository()`**: Direct usage of `@InjectRepository` in services for mutation paths is forbidden. All mutations must resolve repositories through the context-aware getter.
- **Raw SQL Mutations**: Writing to business entities via raw SQL bypasses the `TenantSubscriber` and is prohibited for any operation requiring institutional legitimacy.
- **Context-less Service Execution**: Services must not perform state mutations unless executed within a valid `TenantContext` scope.

### 5.2. Mandatory Provenance Integrity
- **No "Optimization" of Provenance**: Future developers are prohibited from "optimizing away" the materialized provenance columns (`governanceProvenanceHash`, `epistemicConfidence`) for performance reasons.
- **Constraint Enforcement**: Any new business entity MUST implement the forensic columns and be registered with the global `TenantSubscriber`.

## 7. CI/CD Enforcement & Violation Taxonomy

The CI/CD pipeline serves as the **First Non-Trust-Based Execution Boundary**. It is the final gatekeeper that transforms "Mechanical Enforcement" into a "Workflow-Enforced Lattice."

### 7.1. Violation Taxonomy & Severity Routing
The following breaches are classified and handled with increasing severity:
- **`ARCHITECTURAL_BREACH` (Critical)**: Detected direct bypass of `TenantContext` via forbidden patterns (e.g., raw SQL, direct `@InjectRepository` bypass).
    - **Action**: Immediate build failure. Merge block. Security alert emission.
- **`GOVERNANCE_BYPASS_ATTEMPT` (High)**: Modification or removal of provenance columns or `TenantSubscriber` logic without Institutional Ratification.
    - **Action**: Immediate build failure. Manual review requirement by Quorum.
- **`CONTEXT_DETACHMENT_RISK` (Medium)**: New domain services created without explicit `TenantContext` injection or repository resolution through the context getter.
    - **Action**: CI Warning. Manual review required.
- **`PROVENANCE_INTEGRITY_FAILURE` (High)**: Failure of unit/integration tests verifying the injection of epoch hashes into persistence events.
    - **Action**: Immediate build failure.

### 7.2. Admission Plane Enforcement (CI Gates)
- **Gate 1: Static AST Scan**: Uses `ts-morph` or equivalent to scan for forbidden syntax patterns (Execution Plane bypasses).
- **Gate 2: Dependency Matrix Check**: Enforces the "Forbidden Dependency Matrix" to prevent domain leakage.
- **Gate 3: Forensic Replay Validation**: Automated replay of governance epochs to verify historical reconstructability.

### 7.3. Admission Invariant
**No production entry point exists outside this kernel.** Any code reaching the `main` branch is guaranteed by the Admission Plane to be compliant with the **Execution Plane Invariants**.

**Status: SYSTEM FROZEN.** The platform is now a **Production-Operable Substrate** operating within a non-trust-based, 3-plane governance model.

## 8. Living Governance & Policy Versioning

To prevent "Governance Rigidity Failure" and allow the enforcement lattice to evolve without destabilizing production, the system is finalized with a **Living Governance Kernel**.

### 8.1. Policy Versioning & Registry
Architectural rules and enforcement gates are versioned independently of the domain code:
- **Policy Registry**: A canonical mapping of `GovernanceEpoch` to `PolicyVersion`.
- **Backward-Compatible Enforcement**: Older epochs can be replayed against their corresponding historical policy version, ensuring forensic auditability remains constant even as rules evolve.

### 8.2. Shadow-Mode Testing & Staged Rollout
- **Shadow Mode**: New enforcement rules (e.g., stricter linting or AST scans) are first deployed in "Shadow Mode"—emitting warnings and audit logs in CI without blocking merges.
- **Staged Rollout**: Once a policy version demonstrates zero false positives in shadow mode, it is promoted to **`ENFORCED`** status via a formal Institutional Ratification.

### 8.3. Governance Compiler IR (Intermediate Representation)
The **Violation Taxonomy** (ARCHITECTURAL_BREACH, etc.) functions as the IR for the governance compiler:
- **Semantic Mapping**: Policy changes are mapped to specific IR failure codes, ensuring that "Policy Drift" is itself a trackable and auditable event in the system graph.

**Status: SYSTEM FROZEN.** The platform is now a **Living Regulated Execution System**—the absolute terminal form of the Akul Dravin institutional design.

**No new governance primitives are permitted without institutional ratification.**
