import { EvaluationContext, EvaluationResult, ExecutionMode } from '../../modules/policy-engine/types/policy.types';

// Inline type – the career-growth module does not expose a types sub-directory.
export type CareerEventStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export const WORKFORCE_EVENTS = {
  POLICY_DECISION: 'workforce.policy.decision',
  PROMOTION: 'workforce.promotion.evolution',
  RECONCILIATION: 'workforce.truth.reconciliation',
  TELEPHONY: 'workforce.comm.interaction',
  AUDIT: 'workforce.forensic.audit',
};

/**
 * matches the user's specific JSON requirement:
 * { "employee": "E123", "decision": "PROMOTION_RECOMMENDATION", "mode": "REVIEW", ... }
 */
export class PolicyDecisionEvent {
  employee!: string;
  decision!: string;
  mode!: ExecutionMode;
  policy!: string;
  risk!: string;
  timestamp!: string;
  traceId!: string;
  raw_result!: EvaluationResult;
  raw_context!: EvaluationContext;
}

export class PromotionEvent {
  employeeId!: string;
  type!: 'promotion' | 'increment';
  status!: CareerEventStatus;
  traceId!: string;
  metadata?: any;
}

export class TelephonyEvent {
  callId!: string;
  to!: string;
  duration?: number;
  sentiment!: string;
  transcript?: string;
  employeeId!: string;
}
