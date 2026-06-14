/**
 * src/lib/query/keys.ts
 * Centralised query key factory for all React Query hooks.
 *
 * Principle: Never hardcode strings in useQuery calls.
 * Using this factory guarantees:
 *   - Type-safe invalidation
 *   - Correct cache hierarchy (list vs detail)
 *   - Easy global invalidation per domain
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) })
 */

export const queryKeys = {
  // ── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: {
    all:     ()              => ['dashboard']                        as const,
    kpis:    ()              => ['dashboard', 'kpis']               as const,
    metrics: ()              => ['dashboard', 'metrics']            as const,
    aiInsights: ()           => ['dashboard', 'ai-insights']        as const,
    pendingApprovals: ()     => ['dashboard', 'pending-approvals']  as const,
  },

  // ── Employees ───────────────────────────────────────────────────────────────
  employees: {
    all:        ()           => ['employees']                       as const,
    list:       (params?: Record<string, unknown>) => ['employees', 'list', params] as const,
    detail:     (id: string) => ['employees', 'detail', id]        as const,
    attendance: (id: string, month?: string) => ['employees', 'attendance', id, month] as const,
    lifecycle:  ()           => ['employees', 'lifecycle']         as const,
  },

  // ── Payroll ─────────────────────────────────────────────────────────────────
  payroll: {
    all:        ()            => ['payroll']                        as const,
    cycles:     ()            => ['payroll', 'cycles']             as const,
    cycle:      (id: string)  => ['payroll', 'cycle', id]         as const,
    payslips:   (cycleId: string) => ['payroll', 'payslips', cycleId] as const,
    variance:   (cycleId: string) => ['payroll', 'variance', cycleId] as const,
    forecast:   ()            => ['payroll', 'forecast']           as const,
  },

  // ── Recruitment / ATS ───────────────────────────────────────────────────────
  recruitment: {
    all:        ()           => ['recruitment']                     as const,
    pipeline:   ()           => ['recruitment', 'pipeline']        as const,
    candidates: (params?: Record<string, unknown>) => ['recruitment', 'candidates', params] as const,
    candidate:  (id: string) => ['recruitment', 'candidate', id]  as const,
    openRoles:  ()           => ['recruitment', 'open-roles']     as const,
  },

  // ── AI Hub ──────────────────────────────────────────────────────────────────
  ai: {
    all:         ()           => ['ai']                            as const,
    models:      ()           => ['ai', 'models']                 as const,
    predictions: ()           => ['ai', 'predictions']            as const,
    insights:    ()           => ['ai', 'insights']               as const,
    chatHistory: ()           => ['ai', 'chat-history']           as const,
  },

  // ── Analytics ──────────────────────────────────────────────────────────────
  analytics: {
    all:         ()           => ['analytics']                     as const,
    headcount:   (period?: string) => ['analytics', 'headcount', period] as const,
    attrition:   (period?: string) => ['analytics', 'attrition', period] as const,
    costTrend:   (period?: string) => ['analytics', 'cost-trend', period] as const,
  },

  // ── Notifications ───────────────────────────────────────────────────────────
  notifications: {
    all:         ()           => ['notifications']                 as const,
    unread:      ()           => ['notifications', 'unread']      as const,
  },

  // ── Compliance ─────────────────────────────────────────────────────────────
  compliance: {
    all:         ()           => ['compliance']                    as const,
    posture:     ()           => ['compliance', 'posture']        as const,
    auditLog:    (params?: Record<string, unknown>) => ['compliance', 'audit-log', params] as const,
    risks:       ()           => ['compliance', 'risks']          as const,
  },

  // ── Performance ────────────────────────────────────────────────────────────
  performance: {
    all:         ()           => ['performance']                   as const,
    okrs:        (cycleId?: string) => ['performance', 'okrs', cycleId] as const,
    reviews:     (cycleId?: string) => ['performance', 'reviews', cycleId] as const,
  },
} as const;
