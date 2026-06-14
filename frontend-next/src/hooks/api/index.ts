/**
 * src/hooks/api/index.ts
 * API hooks barrel — single import point for all React Query hooks.
 *
 * Usage:
 *   import { useDashboardKpis, usePayrollTrend, useSendChatMessage } from '@/hooks/api';
 */

// ── Dashboard ─────────────────────────────────────────────────────────────────
export {
  useDashboardKpis,
  useHeadcountTrend,
  useDeptBreakdown,
  useAiInsights,
  usePendingApprovals,
  useDashboardKpisSuspense,
} from './useDashboard';
export type {
  DashboardKpiDto,
  HeadcountDataPoint,
  DeptBreakdownItem,
  AiInsightDto,
  PendingApprovalDto,
} from './useDashboard';

// ── Employees / HRMS ──────────────────────────────────────────────────────────
export {
  useHrmsKpis,
  useEmployeeList,
  useAttendanceTrend,
  useLeaveByType,
  useApproveLeave,
} from './useEmployees';
export type {
  EmployeeStatus,
  EmployeeListItem,
  EmployeeListParams,
  PaginatedEmployees,
  AttendanceWeekPoint,
  LeaveTypePoint,
  HrmsKpiDto,
} from './useEmployees';

// ── Payroll ───────────────────────────────────────────────────────────────────
export {
  usePayrollKpis,
  useCurrentCycle,
  usePayrollTrend,
  usePayrollVariance,
  usePayslips,
  useRunPayrollCycle,
  useApprovePayroll,
} from './usePayroll';
export type {
  PayrollCycleStatus,
  PayrollCycleDto,
  PayrollKpiDto,
  PayrollTrendPoint,
  PayrollVarianceDto,
  PayslipRow,
  PayslipListParams,
} from './usePayroll';

// ── Recruitment / ATS ─────────────────────────────────────────────────────────
export {
  useAtsKpis,
  usePipelineFunnel,
  useHireTrend,
  useSourceMix,
  useCandidates,
  useOpenRoles,
  useAdvanceCandidate,
  usePostRole,
} from './useRecruitment';
export type {
  CandidateStage,
  OpeningPriority,
  AtsKpiDto,
  PipelineFunnelItem,
  HireTrendPoint,
  SourceMixItem,
  CandidateDto,
  OpenRoleDto,
} from './useRecruitment';

// ── AI Copilot ────────────────────────────────────────────────────────────────
export {
  useAiKpis,
  useAiModels,
  useAiPredictions,
  useAccuracyTrend,
  useChatHistory,
  useSendChatMessage,
  useRefreshModel,
} from './useAi';
export type {
  ModelStatus,
  AiModelDto,
  AiPredictionDto,
  AiKpiDto,
  AccuracyTrendPoint,
  ChatMessage,
} from './useAi';
