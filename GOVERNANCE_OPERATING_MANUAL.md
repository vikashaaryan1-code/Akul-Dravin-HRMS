# GOVERNANCE OPERATING MANUAL: v1.0-GOVERNED

## 1. Introduction
This manual provides the practical, day-to-day workflows for interacting with the Akul Dravin Institutional Coordination Substrate. It is the operational bridge between the **Architecture Specification** and the engineering reality.

## 2. Engineering Workflows

### 2.1. Proposing a Mutation Path
When adding a new feature that requires state mutation:
1. **Repository Resolution**: DO NOT use `@InjectRepository`. Instead, resolve your repository via `TenantContext.getRepository(Entity)`.
2. **Provenance Awareness**: Ensure your service method is executed within a valid `TenantContext` scope (usually via the global `TenantMiddleware`).
3. **Forensic Check**: Verify that your new entity (if any) implements the `governanceProvenanceHash` and `epistemicConfidence` columns.

### 2.2. Interacting with the CI Policy Kernel
If your PR is blocked by a governance gate:
- **ARCHITECTURAL_BREACH**: You have used a forbidden pattern (e.g., direct repository bypass). **Fix**: Refactor your code to use the `TenantContext` pattern.
- **GOVERNANCE_BYPASS_ATTEMPT**: You have modified core governance logic. **Action**: This requires formal **Quorum Ratification**.

## 3. Reviewer Guidelines

### 3.1. Evaluating Institutional Risk
Reviewers must assess every PR against the three governance pillars:
1. **Structural Integrity**: Does the code violate AST-level constraints?
2. **Operational Provenance**: Is the mutation path context-bound?
3. **Evolutionary Legitimacy**: Does the change introduce "Governance Runaway" (unnecessary complexity)?

### 3.2. Quorum Ratification Protocol
For high-risk changes (e.g., modifying `TenantSubscriber`):
1. **Submission**: Propose the change via a formal Governance RFC.
2. **Analysis**: Evaluate the impact on the **Complexity Budget**.
3. **Ratification**: Require approval from the defined multi-party human quorum.

## 4. Violation Management
- **False Positives**: If a lint rule incorrectly flags safe code, DO NOT use `eslint-disable`. Propose a **Policy Rationalization** to the Quorum.
- **Legacy Exceptions**: For legacy unanchored paths, ensure they are explicitly tagged with `LEGACY_UNANCHORED` metadata.

**Status: OPERATIONAL.** The platform is ready for high-assurance execution.
