/**
 * PLAN CATALOG
 *
 * Single source of truth for all plan definitions.
 * Every feature gate, quota check, and middleware guard reads from here.
 *
 * Plans:
 *   STARTER      – small teams, core HRMS only
 *   GROWTH       – mid-size, full HRMS + ATS + basic analytics
 *   ENTERPRISE   – full platform, AI, white-label, unlimited seats
 *   UNLIMITED    – platform-admin internal / MSP resellers
 *
 * Feature flags are additive — each higher plan inherits lower plan features.
 * Quota -1 means unlimited.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Plan codes (stored in subscriptions.plan_code column)
// ─────────────────────────────────────────────────────────────────────────────

export enum PlanCode {
  STARTER    = 'STARTER',
  GROWTH     = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
  UNLIMITED  = 'UNLIMITED',
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature flags — every gated capability has a string key here
// ─────────────────────────────────────────────────────────────────────────────

export enum PlanFeature {
  // Core HRMS
  EMPLOYEE_MANAGEMENT    = 'employee_management',
  ATTENDANCE             = 'attendance',
  LEAVE_MANAGEMENT       = 'leave_management',
  PAYROLL                = 'payroll',
  DOCUMENT_CENTER        = 'document_center',

  // Recruitment
  ATS_BASIC              = 'ats_basic',        // Job posting + applications
  ATS_PIPELINE           = 'ats_pipeline',     // Kanban + interview scheduling
  ATS_OFFERS             = 'ats_offers',       // Offer management
  RECRUITER_MARKETPLACE  = 'recruiter_marketplace',
  JOB_MARKETPLACE        = 'job_marketplace',

  // Analytics
  ANALYTICS_BASIC        = 'analytics_basic',  // Pre-built reports
  ANALYTICS_ADVANCED     = 'analytics_advanced', // Custom dashboards + forecasting
  GOVERNANCE_DASHBOARD   = 'governance_dashboard',

  // AI
  AI_RESUME_PARSING      = 'ai_resume_parsing',
  AI_MATCH_SCORING       = 'ai_match_scoring',
  AI_PAYROLL_ANOMALY     = 'ai_payroll_anomaly',
  AI_CHATBOT             = 'ai_chatbot',
  AI_WORKFORCE_FORECAST  = 'ai_workforce_forecast',

  // Communication
  NOTIFICATION_EMAIL     = 'notification_email',
  NOTIFICATION_SMS       = 'notification_sms',
  NOTIFICATION_WHATSAPP  = 'notification_whatsapp',

  // Platform
  WHITE_LABEL            = 'white_label',
  CUSTOM_DOMAIN          = 'custom_domain',
  MULTI_BRANCH           = 'multi_branch',
  API_ACCESS             = 'api_access',
  WEBHOOK_OUTBOUND       = 'webhook_outbound',
  SSO_SAML               = 'sso_saml',
  AUDIT_LOG_EXPORT       = 'audit_log_export',
}

// ─────────────────────────────────────────────────────────────────────────────
// Quota limits per plan
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanQuotas {
  /** Maximum active employees. -1 = unlimited. */
  maxEmployees:       number;
  /** Maximum branches/locations. */
  maxBranches:        number;
  /** Maximum open job postings at one time. */
  maxActiveJobs:      number;
  /** Maximum API requests per hour (rate limit). */
  maxApiRequestsPerHour: number;
  /** Document storage limit in MB. */
  maxStorageMb:       number;
  /** Maximum team members (HR/Admin users). */
  maxAdminUsers:      number;
  /** Data retention in days. -1 = unlimited. */
  dataRetentionDays:  number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan definition
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanDefinition {
  code:           PlanCode;
  name:           string;
  monthlyPriceInr: number;
  annualPriceInr:  number;
  features:       Set<PlanFeature>;
  quotas:         PlanQuotas;
  gracePeriodDays: number;  // Days past_due before access blocked
  trialDays:       number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Catalog definitions
// ─────────────────────────────────────────────────────────────────────────────

const STARTER_FEATURES = new Set<PlanFeature>([
  PlanFeature.EMPLOYEE_MANAGEMENT,
  PlanFeature.ATTENDANCE,
  PlanFeature.LEAVE_MANAGEMENT,
  PlanFeature.PAYROLL,
  PlanFeature.DOCUMENT_CENTER,
  PlanFeature.ATS_BASIC,
  PlanFeature.ANALYTICS_BASIC,
  PlanFeature.NOTIFICATION_EMAIL,
  PlanFeature.MULTI_BRANCH,
]);

const GROWTH_FEATURES = new Set<PlanFeature>([
  ...STARTER_FEATURES,
  PlanFeature.ATS_PIPELINE,
  PlanFeature.ATS_OFFERS,
  PlanFeature.RECRUITER_MARKETPLACE,
  PlanFeature.JOB_MARKETPLACE,
  PlanFeature.ANALYTICS_ADVANCED,
  PlanFeature.AI_RESUME_PARSING,
  PlanFeature.AI_MATCH_SCORING,
  PlanFeature.NOTIFICATION_SMS,
  PlanFeature.API_ACCESS,
  PlanFeature.WEBHOOK_OUTBOUND,
  PlanFeature.AUDIT_LOG_EXPORT,
]);

const ENTERPRISE_FEATURES = new Set<PlanFeature>([
  ...GROWTH_FEATURES,
  PlanFeature.AI_PAYROLL_ANOMALY,
  PlanFeature.AI_CHATBOT,
  PlanFeature.AI_WORKFORCE_FORECAST,
  PlanFeature.NOTIFICATION_WHATSAPP,
  PlanFeature.WHITE_LABEL,
  PlanFeature.CUSTOM_DOMAIN,
  PlanFeature.SSO_SAML,
  PlanFeature.GOVERNANCE_DASHBOARD,
]);

const UNLIMITED_FEATURES = new Set<PlanFeature>([
  ...ENTERPRISE_FEATURES,
]);

export const PLAN_CATALOG: Record<PlanCode, PlanDefinition> = {
  [PlanCode.STARTER]: {
    code:            PlanCode.STARTER,
    name:            'Starter',
    monthlyPriceInr: 999,
    annualPriceInr:  9990,
    features:        STARTER_FEATURES,
    quotas: {
      maxEmployees:          25,
      maxBranches:           1,
      maxActiveJobs:         5,
      maxApiRequestsPerHour: 500,
      maxStorageMb:          1_024,
      maxAdminUsers:         3,
      dataRetentionDays:     365,
    },
    gracePeriodDays: 7,
    trialDays:       14,
  },

  [PlanCode.GROWTH]: {
    code:            PlanCode.GROWTH,
    name:            'Growth',
    monthlyPriceInr: 2_499,
    annualPriceInr:  24_990,
    features:        GROWTH_FEATURES,
    quotas: {
      maxEmployees:          150,
      maxBranches:           5,
      maxActiveJobs:         25,
      maxApiRequestsPerHour: 2_000,
      maxStorageMb:          10_240,
      maxAdminUsers:         15,
      dataRetentionDays:     730,
    },
    gracePeriodDays: 14,
    trialDays:       14,
  },

  [PlanCode.ENTERPRISE]: {
    code:            PlanCode.ENTERPRISE,
    name:            'Enterprise',
    monthlyPriceInr: 7_999,
    annualPriceInr:  79_990,
    features:        ENTERPRISE_FEATURES,
    quotas: {
      maxEmployees:          -1,
      maxBranches:           -1,
      maxActiveJobs:         -1,
      maxApiRequestsPerHour: 10_000,
      maxStorageMb:          102_400,
      maxAdminUsers:         -1,
      dataRetentionDays:     -1,
    },
    gracePeriodDays: 30,
    trialDays:       30,
  },

  [PlanCode.UNLIMITED]: {
    code:            PlanCode.UNLIMITED,
    name:            'Unlimited (Internal)',
    monthlyPriceInr: 0,
    annualPriceInr:  0,
    features:        UNLIMITED_FEATURES,
    quotas: {
      maxEmployees:          -1,
      maxBranches:           -1,
      maxActiveJobs:         -1,
      maxApiRequestsPerHour: -1,
      maxStorageMb:          -1,
      maxAdminUsers:         -1,
      dataRetentionDays:     -1,
    },
    gracePeriodDays: 9999,
    trialDays:       0,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve plan by code. Falls back to STARTER for unknown codes. */
export function resolvePlan(code: string): PlanDefinition {
  return PLAN_CATALOG[code as PlanCode] ?? PLAN_CATALOG[PlanCode.STARTER];
}

/** Check if a plan includes a feature. */
export function planHasFeature(code: string, feature: PlanFeature): boolean {
  return resolvePlan(code).features.has(feature);
}

/** Check if a quota value is within plan limits. -1 means unlimited. */
export function withinQuota(planCode: string, quota: keyof PlanQuotas, currentValue: number): boolean {
  const limit = resolvePlan(planCode).quotas[quota];
  return limit === -1 || currentValue < limit;
}
