/**
 * Platform role definitions — used in @Roles() decorator and RolesGuard.
 *
 * Hierarchy (highest → lowest privilege):
 *   ROOT_OWNER → PLATFORM_ADMIN → SUPER_ADMIN →
 *   WHITE_LABEL_PARTNER → COMPANY_ADMIN → BRANCH_ADMIN →
 *   HR_MANAGER / FINANCE_MANAGER / SALES_MANAGER →
 *   TEAM_MANAGER → TEAM_LEADER →
 *   HR_ADMIN → RECRUITER → EMPLOYEE → GUEST / JOB_SEEKER
 *
 * Naming convention: kebab-case throughout (matches JWT role claims).
 * NEVER use underscores — guards compare string values directly.
 */
export enum Role {
  // ── Platform operators ──────────────────────────────────────────────────
  ROOT_OWNER          = 'root-owner',
  PLATFORM_ADMIN      = 'platform-admin',
  SUPER_ADMIN         = 'super-admin',
  WHITE_LABEL_PARTNER = 'white-label-partner',

  // ── Company-level admins ────────────────────────────────────────────────
  COMPANY_ADMIN = 'company-admin',
  BRANCH_ADMIN  = 'branch-admin',

  // ── Functional managers ─────────────────────────────────────────────────
  HR_MANAGER      = 'hr-manager',
  FINANCE_MANAGER = 'finance-manager',    // Fixed: was 'finance_manager'
  SALES_MANAGER   = 'sales-manager',
  TEAM_MANAGER    = 'team-manager',
  TEAM_LEADER     = 'team-leader',

  // ── Specialists ─────────────────────────────────────────────────────────
  HR_ADMIN          = 'hr-admin',                 // Fixed: was 'hr_admin'
  RECRUITER         = 'recruiter',

  /**
   * Read-only governance observer — can view audit trails, governance dashboards,
   * violation logs, outbox state, and replay inspector.
   * Cannot mutate any operational data or trigger transitions.
   * Scoped to platform operators (cross-tenant view).
   */
  SECURITY_AUDITOR    = 'security-auditor',

  /**
   * Governance-scoped auditor — same read access as SECURITY_AUDITOR
   * but restricted to their own tenant. Issued to compliance officers
   * who need audit trail access without full platform visibility.
   */
  GOVERNANCE_AUDITOR  = 'governance-auditor',

  // ── End users ───────────────────────────────────────────────────────────
  EMPLOYEE   = 'employee',
  GUEST      = 'guest',
  JOB_SEEKER = 'job-seeker',
}

/**
 * Convenience sets for guard shorthand.
 *
 * Usage:
 *   @Roles(...ADMIN_ROLES)
 *   @Roles(...MANAGER_ROLES)
 */
export const PLATFORM_ROLES: Role[] = [
  Role.ROOT_OWNER,
  Role.PLATFORM_ADMIN,
  Role.SUPER_ADMIN,
];

export const ADMIN_ROLES: Role[] = [
  ...PLATFORM_ROLES,
  Role.WHITE_LABEL_PARTNER,
  Role.COMPANY_ADMIN,
  Role.BRANCH_ADMIN,
];

export const MANAGER_ROLES: Role[] = [
  ...ADMIN_ROLES,
  Role.HR_MANAGER,
  Role.FINANCE_MANAGER,
  Role.SALES_MANAGER,
  Role.TEAM_MANAGER,
  Role.TEAM_LEADER,
];

export const HR_ROLES: Role[] = [
  Role.HR_MANAGER,
  Role.HR_ADMIN,
  Role.COMPANY_ADMIN,
  ...PLATFORM_ROLES,
];

export const FINANCE_ROLES: Role[] = [
  Role.FINANCE_MANAGER,
  Role.COMPANY_ADMIN,
  ...PLATFORM_ROLES,
];

/**
 * Roles authorized to read the Governance Control Plane.
 * These roles have read-only access to:
 *   - Outbox status and dead-letter queues
 *   - Replay lag and handler failure metrics
 *   - Transition violation logs
 *   - Domain contract assertion results
 *   - Governance health dashboard
 *
 * NEVER grant these roles write access to operational entities.
 */
export const GOVERNANCE_ROLES: Role[] = [
  Role.ROOT_OWNER,
  Role.PLATFORM_ADMIN,
  Role.SECURITY_AUDITOR,
  Role.GOVERNANCE_AUDITOR,
  Role.SUPER_ADMIN,
];
