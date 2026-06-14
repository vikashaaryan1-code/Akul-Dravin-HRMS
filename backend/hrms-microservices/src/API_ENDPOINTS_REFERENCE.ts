/**
 * AKUL DRAVIN HRMS - ENDPOINT QUICK REFERENCE GUIDE
 *
 * This file documents all REST API endpoints that should exist per the master spec.
 * Use this as a reference to audit and complete missing endpoints.
 */

// ===== EMPLOYEE LIFECYCLE API =====
// GET    /api/v1/employees                    - List employees (paginated, filtered)
// GET    /api/v1/employees/:id                - Get employee details
// POST   /api/v1/employees                    - Create new employee
// PATCH  /api/v1/employees/:id                - Update employee
// DELETE /api/v1/employees/:id                - Soft delete employee
// POST   /api/v1/employees/:id/lifecycle/:action - Trigger lifecycle transition

// ===== ATTENDANCE API =====
// POST   /api/v1/attendance/checkin           - Mobile face attendance check-in
// POST   /api/v1/attendance/checkout          - Check-out with geolocation
// GET    /api/v1/attendance/my-records        - Get my attendance history
// GET    /api/v1/attendance/team              - Manager view - team attendance
// GET    /api/v1/attendance/analytics         - Attendance analytics & patterns

// ===== LEAVE MANAGEMENT API =====
// POST   /api/v1/leaves/request               - Submit leave request
// GET    /api/v1/leaves/my-balance            - Get my leave balance
// GET    /api/v1/leaves/pending-approvals     - For managers/HR
// POST   /api/v1/leaves/:id/approve           - Approve leave
// POST   /api/v1/leaves/:id/reject            - Reject leave
// GET    /api/v1/leaves/calendar              - Leave calendar view

// ===== PAYROLL API =====
// GET    /api/v1/payroll/my-payslip/:month    - Get payslip
// POST   /api/v1/payroll/process-batch        - Process monthly payroll
// GET    /api/v1/payroll/breakdown            - Salary breakdown explanation
// GET    /api/v1/payroll/tax-summary          - Tax calculations

// ===== RECRUITMENT API =====
// POST   /api/v1/jobs                         - Create job posting
// GET    /api/v1/jobs/:id/applications        - Get applications for job
// POST   /api/v1/applications/:id/screen      - AI screening
// POST   /api/v1/applications/:id/move-to     - Move in ATS pipeline
// GET    /api/v1/candidates/:id/match-score   - Calculate match score
// POST   /api/v1/interviews/schedule          - Schedule interview

// ===== AI ENGINE API =====
// POST   /api/v1/ai/leave-analysis            - Analyze leave request
// POST   /api/v1/ai/onboarding-plan           - Generate onboarding
// GET    /api/v1/ai/attrition-risk/:employeeId - Predict attrition
// POST   /api/v1/ai/job-description           - Generate job description
// POST   /api/v1/ai/talent-score              - Calculate match score
// POST   /api/v1/ai/promotion-recommendation  - Get promotion path
// POST   /api/v1/ai/chat                      - Employee Q&A assistant

// ===== SUBSCRIPTION & BILLING API =====
// GET    /api/v1/subscriptions/current        - Get current subscription
// GET    /api/v1/subscriptions/plans          - List available plans
// POST   /api/v1/subscriptions/upgrade        - Upgrade subscription
// GET    /api/v1/billing/invoices             - List invoices
// POST   /api/v1/billing/webhook/stripe       - Stripe webhook handler

// ===== ADMIN API =====
// GET    /api/v1/admin/organizations          - List all organizations
// POST   /api/v1/admin/organizations          - Create organization
// GET    /api/v1/admin/users                  - List users
// POST   /api/v1/admin/users                  - Create user
// PATCH  /api/v1/admin/settings               - Update system settings

// ===== ANALYTICS API =====
// GET    /api/v1/analytics/dashboard          - Org dashboard metrics
// GET    /api/v1/analytics/workforce          - Workforce analytics
// GET    /api/v1/analytics/recruitment        - Recruitment funnel

// ===== DOCUMENT API =====
// GET    /api/v1/documents/:id                - Get document
// POST   /api/v1/documents/:id/sign           - E-sign document
// GET    /api/v1/documents/:id/download       - Download PDF

export const API_REFERENCE = {
  VERSION: 'v1',
  BASE_PATH: '/api/v1',
  ENDPOINTS: {
    // Employee endpoints
    EMPLOYEES: {
      LIST: '/employees',
      GET: '/employees/:id',
      CREATE: '/employees',
      UPDATE: '/employees/:id',
      DELETE: '/employees/:id',
      LIFECYCLE: '/employees/:id/lifecycle/:action',
    },
    // Attendance
    ATTENDANCE: {
      CHECKIN: '/attendance/checkin',
      CHECKOUT: '/attendance/checkout',
      MY_RECORDS: '/attendance/my-records',
      TEAM: '/attendance/team',
      ANALYTICS: '/attendance/analytics',
    },
    // Leave
    LEAVE: {
      REQUEST: '/leaves/request',
      MY_BALANCE: '/leaves/my-balance',
      PENDING: '/leaves/pending-approvals',
      APPROVE: '/leaves/:id/approve',
      REJECT: '/leaves/:id/reject',
      CALENDAR: '/leaves/calendar',
    },
    // Payroll
    PAYROLL: {
      PAYSLIP: '/payroll/my-payslip/:month',
      PROCESS: '/payroll/process-batch',
      BREAKDOWN: '/payroll/breakdown',
      TAX: '/payroll/tax-summary',
    },
    // Recruitment
    RECRUITMENT: {
      JOBS: '/jobs',
      JOB_DETAIL: '/jobs/:id',
      APPLICATIONS: '/jobs/:id/applications',
      SCREEN: '/applications/:id/screen',
      MOVE: '/applications/:id/move-to',
      MATCH: '/candidates/:id/match-score',
      SCHEDULE: '/interviews/schedule',
    },
    // AI
    AI: {
      LEAVE_ANALYSIS: '/ai/leave-analysis',
      ONBOARDING: '/ai/onboarding-plan',
      ATTRITION: '/ai/attrition-risk/:employeeId',
      JOB_DESCRIPTION: '/ai/job-description',
      TALENT_SCORE: '/ai/talent-score',
      PROMOTION: '/ai/promotion-recommendation',
      CHAT: '/ai/chat',
    },
  },
};
