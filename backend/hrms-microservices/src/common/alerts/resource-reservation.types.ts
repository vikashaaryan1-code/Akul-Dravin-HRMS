// ── Reservation Status ────────────────────────────────────────────────────────

export enum ReservationStatus {
  ACTIVE      = 'ACTIVE',
  EXPIRED     = 'EXPIRED',
  RELEASED    = 'RELEASED',
  SUPERSEDED  = 'SUPERSEDED',
  BORROWED    = 'BORROWED', // Phase AT-1: borrowed for subplan inheritance
}

/**
 * Phase AW: Adaptive Stability Modes.
 * Governs how the kernel admits new work vs stabilizes existing topology.
 */
export enum KernelMode {
  THROUGHPUT   = 'THROUGHPUT',   // Standard operation
  STABILITY    = 'STABILITY',    // High entropy damping (prefer tenure)
  RECOVERY     = 'RECOVERY',     // Circuit breaker active (critical only)
  CONSERVATION = 'CONSERVATION', // Extreme stress (reject all new)
}

export type ReservationOwnerType = 'PLAN' | 'SIGNAL' | 'OPERATOR' | 'SUBPLAN';

// ── Core Reservation ──────────────────────────────────────────────────────────

/**
 * A time-limited pre-claim on a target resource.
 *
 * Reservations allow workflows to signal "I intend to use this resource soon"
 * before the corresponding mitigation signal is created. This prevents
 * lower-priority mitigations from racing in during the window between
 * prerequisite completion and step signal creation.
 *
 * ── Lifecycle ────────────────────────────────────────────────────────────────
 *
 *  ACTIVE → RELEASED  (normal: step executes, reservation released on completion)
 *  ACTIVE → EXPIRED   (TTL elapsed — plan was deferred, aborted, or too slow)
 *  ACTIVE → SUPERSEDED (a CRITICAL reservation displaced an existing HIGH one)
 *
 * ── Priority semantics ────────────────────────────────────────────────────────
 *
 *  Only one ACTIVE reservation per resource at a time (the highest-priority one).
 *  Lower-priority reservations are queued in WAITING_RESERVATION status
 *  (outside this type, tracked by the service's waitQueue).
 */
export interface ResourceReservation {
  id:            string;
  resourceKey:   string;
  ownerId:       string;
  ownerType:     ReservationOwnerType;
  ownerLabel:    string;
  urgency:       'CRITICAL' | 'HIGH' | 'MEDIUM';
  utilityScore:  number;
  status:        ReservationStatus;
  reservedAt:    string;
  expiresAt:     string;
  releasedAt?:   string;
  planStepId?:   string;
  /**
   * Phase AT-1: Reservation Inheritance.
   * Set when status=BORROWED — ID of the parent ACTIVE reservation
   * this borrow right was derived from. Child inherits parent's expiry and urgency.
   */
  borrowedFromId?: string;
  parentReservationId?: string;
  supersededReservationId?: string;
  /**
   * Phase AU-1: Topology Governance.
   * Tracks how many levels of delegation exist above this borrow.
   */
  borrowDepth:   number;
  /**
   * Phase AU-1: Churn Control.
   * How many times this specific resource slot has been superseded
   * since the original owner claimed it.
   */
  supersessionCount: number;
  /**
   * Phase AU-2: Coordination Pressure.
   * 0-1 score representing lease entrenchment and fairness decay.
   */
  coordinationPressure: number;
  /**
   * Phase AU-5: Pressure Hysteresis.
   * Smoothed EMA of the coordination pressure to avoid threshold flapping.
   */
  emaPressure: number;
  /**
   * Phase AU-5: Anti-Thrash Cooldown.
   * Timestamp of the last time this resource slot was superseded.
   */
  lastSupersededAt?: string;
  /**
   * Phase AW: Coordination Energy Budgeting.
   * Cumulative energy cost: (tenure * (1 + borrowDepth) * (1 + supersessionCount)).
   */
  coordinationEnergy: number;
}

// ── Waiting Reservation ───────────────────────────────────────────────────────

/**
 * A pending reservation request that is queued behind the current ACTIVE holder.
 * When the active reservation is released, the highest-priority entry
 * in the wait queue is granted ACTIVE status.
 */
export interface WaitingReservation {
  requestId:   string;
  resourceKey: string;
  ownerId:     string;
  ownerType:   ReservationOwnerType;
  ownerLabel:  string;
  urgency:     'CRITICAL' | 'HIGH' | 'MEDIUM';
  utilityScore: number;
  requestedAt: string;
  /** Phase AU-1: How many times a higher-priority request jumped over this one. */
  skipCount:    number;
  /** Phase AU-3: Calculated starvation severity based on skipCount and age. */
  starvationScore: number;
}

// ── Report ────────────────────────────────────────────────────────────────────

export interface ReservationReport {
  activeReservations: ResourceReservation[];
  waitQueues:         Record<string, WaitingReservation[]>; // resourceKey → sorted waiting list
  expiryAlerts:       ResourceReservation[];               // expiring within next 5 min tick
  stats: {
    totalActive:   number;
    totalWaiting:  number;
    totalBorrows:  number;
    avgWaitMs:     number;
    maxWaitMs:     number;
    coordinationEntropy: number; // Phase AU-3
    starvationIndex:     number; // Phase AU-3
    ownershipFragmentation: number; // Phase AU-3
    /** Phase AW: Stability Envelope mapping (0-1 risk score). */
    oscillationOnsetRisk: number;
    /** Phase AW: Current adaptive kernel mode. */
    kernelMode: KernelMode;
    /** Phase AZ: Tamper-proof hash of the current governance epoch. */
    governanceStateHash?: string;
  };
  confidenceScore?: number;
  epistemicCaveat?: string;
  residualRisk?: string;
}
