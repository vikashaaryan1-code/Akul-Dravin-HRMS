import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ResourceReservation, WaitingReservation, ReservationReport,
  ReservationOwnerType, ReservationStatus, KernelMode,
} from './resource-reservation.types';
import { AdaptiveTTLService } from './adaptive-ttl.service';
import { CoordinationTelemetryService } from './coordination-telemetry.service';
import { StabilityEnvelopeService } from './stability-envelope.service';
import { GovernanceConstitutionService } from './governance-constitution.service';
import { RegulatorExplainabilityService } from './regulator-explainability.service';
import { GovernanceSnapshotService } from './governance-snapshot.service';
import { ConstitutionalRegistryService } from './constitutional-registry.service';
import { GovernanceClock } from './governance-clock.service';
import { GovernanceBudgetService } from './governance-budget.service';
import { RegulatorInteractionService } from './governance-calculus.service';
import { ToolchainIntegrityService } from './meta-verification.service';
import { GovernanceSkepticismEngine } from './governance-skepticism.engine';
import { GovernanceSovereigntyService } from './governance-sovereignty.service';
import { GovernanceEconomicsService } from './governance-economics.service';

const DEFAULT_TTL_MS    = 15 * 60 * 1000;
const EXPIRY_WARNING_MS = 5  * 60 * 1000;
const MAX_BORROW_DEPTH  = 5;
const MAX_SUPERSESSION_CHAIN = 3;
const EMA_ALPHA = 0.2;
const SUPERSESSION_COOLDOWN_MS = 30_000;
const CIRCUIT_BREAKER_ENTROPY = 0.85;
const MAX_GLOBAL_ENERGY = 5000; // Phase AW-1
const URGENCY_RANK: Record<string, number> = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };

/**
 * RESOURCE RESERVATION SERVICE — Phase AS-1 + AT-1 + AT-4
 *
 * AT-1: borrow() — subplan reservation inheritance without ownership transfer.
 * AT-4: AdaptiveTTLService — per-resource TTL derived from signal lifecycle history.
 */
@Injectable()
export class ResourceReservationService {
  private readonly logger    = new Logger(ResourceReservationService.name);
  private readonly active    = new Map<string, ResourceReservation>();
  private readonly waiting   = new Map<string, WaitingReservation[]>();
  private readonly history   = new Map<string, ResourceReservation>();
  /**
   * Phase AT-1: parentReservationId → child ownerIds with borrow rights.
   * Cleared when parent reservation is archived (expired, released, or superseded).
   */
  private readonly borrows   = new Map<string, string[]>();
  private readonly MAX_HISTORY = 500;
  private readonly criticalRejections = new Map<string, number>();
  private currentMode: { mode: KernelMode; startedAt: string } = { mode: KernelMode.THROUGHPUT, startedAt: new Date().toISOString() };

  constructor(
    private readonly ttlService?: AdaptiveTTLService,
    private readonly telemetry?: CoordinationTelemetryService,
    private readonly envelope?: StabilityEnvelopeService,
    private readonly constitution?: GovernanceConstitutionService,
    private readonly explanator?: RegulatorExplainabilityService,
    private readonly snapshotService?: GovernanceSnapshotService,
    private readonly registry?: ConstitutionalRegistryService,
    private readonly clock?:    GovernanceClock,
    private readonly budget?:           GovernanceBudgetService,
    private readonly dynamics?:         RegulatorInteractionService,
    private readonly integrity?:        ToolchainIntegrityService,
    private readonly skepticism?:       GovernanceSkepticismEngine,
    private readonly sovereignty?: GovernanceSovereigntyService,
    private readonly economics?:   GovernanceEconomicsService,
  ) {}

  // ── Reservation API ───────────────────────────────────────────────────────

  /**
   * Attempt to reserve a resource.
   * TTL is determined by AdaptiveTTLService (per-resource history) when not specified.
   */
  reserve(
    resourceKey:  string,
    ownerId:      string,
    ownerType:    ReservationOwnerType,
    ownerLabel:   string,
    urgency:      'CRITICAL' | 'HIGH' | 'MEDIUM',
    utilityScore: number,
    ttlMs?: number,
    planStepId?: string,
    parentReservationId?: string,
  ): ResourceReservation {
    const resolvedTtl = ttlMs ?? this.ttlService?.getTTL(resourceKey) ?? DEFAULT_TTL_MS;
    const now = new Date();
    const existing = this.active.get(resourceKey);

    // Phase AW: Adaptive Kernel Mode Admission
    const entropy = this.calculateCurrentEntropy();
    const risk = this.envelope?.calculateOscillationRisk() ?? 0;
    const mode = this.envelope?.recommendMode(entropy, risk) ?? KernelMode.THROUGHPUT;
    this.updateMode(mode);

    // Phase AX: Constitutional Invariant Guard
    const totalEnergy = [...this.active.values()].reduce((s, r) => s + r.coordinationEnergy, 0);
    const energyPercent = totalEnergy / MAX_GLOBAL_ENERGY;
    const rejections = this.criticalRejections.get(`${resourceKey}:${ownerId}`) ?? 0;
    
    const constitutionCheck = this.constitution?.verify(urgency, mode, this.currentMode.startedAt, energyPercent, rejections);
    
    if (constitutionCheck && !constitutionCheck.isAllowed) {
      this.telemetry?.recordEvent('CONSTITUTIONAL_REJECTION', resourceKey, ownerLabel, { 
        invariant: constitutionCheck.invariant,
        reason: constitutionCheck.reason 
      });
      this.logger.warn(`[Reservation] CONSTITUTIONAL REJECT: ${ownerLabel} on ${resourceKey} — ${constitutionCheck.reason}`);
      return existing || null as any;
    }

    if (mode === KernelMode.CONSERVATION && !(constitutionCheck?.invariant === 'MAX_CONSERVATION_TENURE')) {
      if (urgency !== 'CRITICAL' || (constitutionCheck?.invariant !== 'CRITICAL_LIVENESS_GUARANTEE')) {
        this.logger.warn(`[Reservation] CONSERVATION MODE: Rejecting ${ownerLabel} on ${resourceKey}`);
        this.trackRejection(resourceKey, ownerId, urgency);
        return existing || null as any;
      }
    }

    if (mode === KernelMode.RECOVERY && (URGENCY_RANK[urgency] < 3 && !parentReservationId)) {
      if (constitutionCheck?.invariant !== 'CRITICAL_LIVENESS_GUARANTEE') {
        this.logger.warn(`[Reservation] RECOVERY MODE: Rejecting non-critical reservation ${ownerLabel}`);
        this.trackRejection(resourceKey, ownerId, urgency);
        return existing || null as any;
      }
    }

    if (!existing || existing.status !== ReservationStatus.ACTIVE) {
      return this.grantActive(resourceKey, ownerId, ownerType, ownerLabel, urgency, utilityScore, resolvedTtl, now, planStepId, parentReservationId);
    }

    const callerRank   = URGENCY_RANK[urgency] ?? 1;
    const existingRank = URGENCY_RANK[existing.urgency] ?? 1;
    
    // Phase AU-5: Use EMA for threshold hysteresis
    const pressure = this.computeCoordinationPressure(resourceKey);
    const smoothedPressure = existing.emaPressure ?? pressure;
    let displacementThreshold = Math.max(0.05, 0.20 - (smoothedPressure * 0.15));

    // Phase AW: Stability Mode Friction
    if (mode === KernelMode.STABILITY) {
      displacementThreshold *= 2; // Double friction to discourage churn
    }
    
    const scoreDelta   = utilityScore - existing.utilityScore;

    // Phase AU-5: Coordination Circuit Breaker
    const entropyBreaker = this.calculateCurrentEntropy();
    if (entropyBreaker >= CIRCUIT_BREAKER_ENTROPY && callerRank < 3) {
      this.telemetry?.recordEvent('BREAKER_ACTIVATION', resourceKey, ownerLabel, { entropy: entropyBreaker, callerRank });
      this.logger.warn(`[Reservation] CIRCUIT BREAKER: Rejecting ${ownerLabel} due to high coordination entropy (${entropyBreaker})`);
      return existing; 
    }

    if (callerRank > existingRank && scoreDelta >= displacementThreshold) {
      // Phase AU-5: Supersession Cooldown (Anti-Thrash)
      const lastChange = new Date(existing.lastSupersededAt || existing.reservedAt).getTime();
      if (now.getTime() - lastChange < SUPERSESSION_COOLDOWN_MS && callerRank < 3) {
        this.telemetry?.recordEvent('COOLDOWN_REJECTION', resourceKey, ownerLabel, { 
          lastChange: new Date(lastChange).toISOString(),
          msSinceChange: now.getTime() - lastChange 
        });
        this.logger.warn(`[Reservation] COOLDOWN: Rejecting supersession for ${resourceKey} — within anti-thrash window`);
        return existing;
      }

      // Phase AU-1: Supersession Chain Guard
      const chainLength = existing.supersessionCount ?? 0;
      if (chainLength >= MAX_SUPERSESSION_CHAIN) {
        this.logger.warn(`[Reservation] REJECTED ${resourceKey}: max supersession chain reached (${chainLength})`);
        return existing; // Forced stability — existing holder is protected
      }

      this.logger.warn(`[Reservation] SUPERSEDE: ${ownerLabel} (${urgency}) displacing ${existing.ownerLabel} on ${resourceKey}`);
      const superseded = { ...existing, status: 'SUPERSEDED' as ReservationStatus };
      this.archiveReservation(superseded);
      const displaced: WaitingReservation = {
        requestId: existing.id, resourceKey, ownerId: existing.ownerId, ownerType: existing.ownerType,
        ownerLabel: existing.ownerLabel, urgency: existing.urgency,
        utilityScore: existing.utilityScore, requestedAt: existing.reservedAt,
        skipCount: 0, starvationScore: 0,
      };

      this.telemetry?.recordEvent('SUPERSESSION', resourceKey, ownerLabel, { 
        displacedOwner: existing.ownerLabel,
        chainLength: chainLength + 1 
      });

      const queue = this.waiting.get(resourceKey) ?? [];
      
      // Phase AU-3: Record "skips" for starvation detection
      queue.forEach(q => { q.skipCount++; });
      
      queue.unshift(displaced);
      this.waiting.set(resourceKey, queue);
      const res = this.grantActive(resourceKey, ownerId, ownerType, ownerLabel, urgency, utilityScore, resolvedTtl, now, planStepId, parentReservationId);
      res.supersededReservationId = existing.id;
      res.supersessionCount = chainLength + 1;
      return res;
    }

    const waitEntry: WaitingReservation = {
      requestId: randomUUID(), resourceKey, ownerId, ownerType, ownerLabel,
      urgency, utilityScore, requestedAt: now.toISOString(),
      skipCount: 0, starvationScore: 0,
    };
    const queue = this.waiting.get(resourceKey) ?? [];
    queue.push(waitEntry);
    queue.sort((a, b) => {
      const rankDiff = (URGENCY_RANK[b.urgency] ?? 1) - (URGENCY_RANK[a.urgency] ?? 1);
      return rankDiff !== 0 ? rankDiff : b.utilityScore - a.utilityScore;
    });
    this.waiting.set(resourceKey, queue);
    return {
      id: waitEntry.requestId, resourceKey, ownerId, ownerType, ownerLabel,
      urgency, utilityScore, status: ReservationStatus.ACTIVE,
      reservedAt: now.toISOString(), expiresAt: new Date(now.getTime() + resolvedTtl).toISOString(), planStepId,
      borrowDepth: 0,
      supersessionCount: 0,
      coordinationPressure: 0,
      emaPressure: 0,
      coordinationEnergy: 0,
    };
  }

  /**
   * Phase AT-1: Reservation Inheritance.
   *
   * Grants a subplan (child) borrow rights on a resource owned by its parent.
   * Child can proceed as if it holds the reservation — without taking ownership.
   *
   * Invariants:
   *  - Child cannot supersede; parent's urgency/utility governs.
   *  - Child cannot release the parent's reservation.
   *  - Borrow rights expire when parent reservation is archived.
   *  - Multiple children can hold concurrent borrows on the same reservation.
   */
  borrow(
    resourceKey:   string,
    parentOwnerId: string,
    childOwnerId:  string,
    childLabel:    string,
  ): ResourceReservation | null {
    const current = this.active.get(resourceKey);
    if (!current || current.ownerId !== parentOwnerId) {
      this.logger.warn(`[Reservation] BORROW DENIED: ${childLabel} — ${resourceKey} not owned by ${parentOwnerId}`);
      return null;
    }

    // Phase AU-1: Delegation Cycle Prevention
    if (this.isOwnerInAncestry(childOwnerId, current)) {
      this.logger.error(`[Reservation] BORROW REJECTED: Cyclic delegation detected. ${childOwnerId} is an ancestor of ${parentOwnerId}`);
      return null;
    }

    // Phase AU-1: Borrow Depth Guard
    if (current.borrowDepth >= MAX_BORROW_DEPTH) {
      this.telemetry?.recordEvent('MAX_DEPTH_REJECTION', resourceKey, childLabel, { depth: current.borrowDepth });
      this.logger.warn(`[Reservation] BORROW REJECTED: Max borrow depth reached (${current.borrowDepth}) for ${resourceKey}`);
      return null;
    }

    const borrows = this.borrows.get(current.id) ?? [];
    if (!borrows.includes(childOwnerId)) {
      borrows.push(childOwnerId);
      this.borrows.set(current.id, borrows);
    }
    const borrowed: ResourceReservation = {
      id:             randomUUID(),
      resourceKey,   ownerId: childOwnerId, ownerType: 'SUBPLAN', ownerLabel: childLabel,
      urgency:        current.urgency,      // inherit parent urgency
      utilityScore:   current.utilityScore, // inherit parent utility
      status:         ReservationStatus.BORROWED,
      reservedAt:     new Date().toISOString(),
      expiresAt:      current.expiresAt,   // inherit parent expiry
      borrowedFromId: current.id,
      parentReservationId: current.id,
      borrowDepth: current.borrowDepth + 1,
      supersessionCount: current.supersessionCount,
      coordinationPressure: 0,
      emaPressure: 0,
      coordinationEnergy: 0,
    };
    this.logger.log(`[Reservation] BORROW: ${childLabel} borrows ${resourceKey} from ${current.ownerLabel}`);
    return borrowed;
  }

  release(resourceKey: string, ownerId: string): boolean {
    const current = this.active.get(resourceKey);
    if (!current || current.ownerId !== ownerId) return false;
    const released: ResourceReservation = { ...current, status: ReservationStatus.RELEASED, releasedAt: new Date().toISOString() };
    this.archiveReservation(released);
    this.active.delete(resourceKey);
    this.logger.debug(`[Reservation] Released ${resourceKey} from ${current.ownerLabel}`);
    this.promoteNext(resourceKey);
    return true;
  }

  isReserved(resourceKey: string): ResourceReservation | null {
    const r = this.active.get(resourceKey);
    return r?.status === 'ACTIVE' ? r : null;
  }

  /** Returns true if caller owns, has borrow rights, or can supersede the current reservation. */
  canProceed(
    resourceKey:  string,
    ownerId:      string,
    urgency:      'CRITICAL' | 'HIGH' | 'MEDIUM',
    utilityScore: number,
  ): boolean {
    const current = this.active.get(resourceKey);
    if (!current) return true;
    if (current.ownerId === ownerId) return true;
    // Phase AT-1: borrow right check
    if ((this.borrows.get(current.id) ?? []).includes(ownerId)) return true;
    
    const callerRank  = URGENCY_RANK[urgency] ?? 1;
    const currentRank = URGENCY_RANK[current.urgency] ?? 1;
    
    // Phase AU-2: Pressure-aware bypass
    const pressure = this.computeCoordinationPressure(resourceKey);
    const threshold = Math.max(0.05, 0.20 - (pressure * 0.15));
    
    return callerRank > currentRank && (utilityScore - current.utilityScore) >= threshold;
  }

  pruneExpired(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [resource, reservation] of this.active.entries()) {
      if (new Date(reservation.expiresAt).getTime() <= now) {
        this.logger.debug(`[Reservation] EXPIRED ${resource} owned by ${reservation.ownerLabel}`);
        this.archiveReservation({ ...reservation, status: 'EXPIRED' as ReservationStatus });
        this.active.delete(resource);
        this.promoteNext(resource);
        pruned++;
      }
    }
    return pruned;
  }

  getReport(
    resourceKey: string = 'GLOBAL', 
    urgency: 'NORMAL' | 'CRITICAL' = 'NORMAL'
  ): ReservationReport {
    const now = this.clock?.now() || Date.now();
    const active     = [...this.active.values()];
    const waitQueues = Object.fromEntries(this.waiting.entries());
    const totalWaiting  = [...this.waiting.values()].reduce((s, q) => s + q.length, 0);
    const totalEnergy = active.reduce((s, r) => s + r.coordinationEnergy, 0);
    const energyPercent = totalEnergy / MAX_GLOBAL_ENERGY;
    const mode = this.currentMode.mode;
    const entropy = this.calculateCurrentEntropy();
    const epochHash = this.generateGovernanceHash(mode, entropy, energyPercent);
    const confidence = this.skepticism?.evaluateConfidence(resourceKey, false) ?? { score: 100, caveat: 'Skepticism offline' };

    const expiryAlerts = active.filter(r => new Date(r.expiresAt).getTime() - now < EXPIRY_WARNING_MS);
    const archived      = [...this.history.values()];

    // Phase AU-3: Calculate starvation scores for all waiters
    for (const queue of this.waiting.values()) {
      queue.forEach(w => {
        const ageMin = (now - new Date(w.requestedAt).getTime()) / 60000;
        w.starvationScore = (w.skipCount * 1.5) + (ageMin * 0.5);
      });
    }

    const totalBorrows = active.filter(r => r.status === ReservationStatus.BORROWED).length;
    const waitTimes = [...this.waiting.values()].flat().map(w => now - new Date(w.requestedAt).getTime());
    const avgWaitMs = waitTimes.length > 0 ? Math.round(waitTimes.reduce((s, x) => s + x, 0) / waitTimes.length) : 0;
    const maxWaitMs = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    return {
      activeReservations: active, waitQueues,
      expiryAlerts,
      stats: {
        totalActive: active.length, totalWaiting,
        totalBorrows,
        avgWaitMs,
        maxWaitMs,
        coordinationEntropy: Math.round(entropy * 100) / 100,
        starvationIndex: Math.max(0, ...[...this.waiting.values()].flat().map(w => w.starvationScore), 0),
        ownershipFragmentation: active.length > 0 ? Math.round((totalBorrows / active.length) * 100) / 100 : 0,
        oscillationOnsetRisk: this.envelope?.calculateOscillationRisk() ?? 0,
        kernelMode:           mode,
        governanceStateHash:  epochHash,
      },
      confidenceScore:     confidence.score,
      epistemicCaveat:     confidence.caveat,
      residualRisk:        'Environmental nondeterminism (jitters, async race windows) remains unmodeled.',
    };
  }

  /**
   * SEALS THE GOVERNANCE PROVENANCE — Phase Final
   * Returns the anchoring metadata for the current coordination epoch.
   */
  sealProvenance(): any {
    const active = [...this.active.values()];
    const totalEnergy = active.reduce((s, r) => s + r.coordinationEnergy, 0);
    const energyPercent = totalEnergy / MAX_GLOBAL_ENERGY;
    const mode = this.currentMode.mode;
    const entropy = this.calculateCurrentEntropy();
    const epochHash = this.generateGovernanceHash(mode, entropy, energyPercent);
    const confidence = this.skepticism?.evaluateConfidence('GLOBAL', false) ?? { score: 100, residualRisk: 'Skepticism offline' };

    return {
      epochHash:    epochHash || 'UNCOMMITTED_EPOCH',
      confidence:   confidence.score,
      residualRisk: confidence.residualRisk || 'Skepticism offline',
    };
  }

  private generateGovernanceHash(mode: KernelMode, entropy: number, energyPercent: number): string | undefined {
    if (!this.snapshotService || !this.registry) return undefined;
    
    const startTime = Date.now();
    const snapshot = this.snapshotService.captureEpoch(
      this.registry.getEffectiveConfig().criticalLivenessMaxRejections, // Simplified versioning ref
      mode,
      entropy,
      energyPercent,
      [...this.active.keys()]
    );
    
    this.economics?.recordHashing(Date.now() - startTime);
    return snapshot.governanceHash;
  }

  getActiveReservations(): ResourceReservation[] { return [...this.active.values()]; }
  getWaitQueue(resourceKey: string): WaitingReservation[] { return this.waiting.get(resourceKey) ?? []; }

  private grantActive(
    resourceKey: string, ownerId: string, ownerType: ReservationOwnerType,
    ownerLabel: string, urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM',
    utilityScore: number, ttlMs: number, now: Date, planStepId?: string,
    parentReservationId?: string,
  ): ResourceReservation {
    // Phase BB: Use injected clock for timestamping
    const timestamp = this.clock?.now() || Date.now();

    const reservation: ResourceReservation = {
      id: randomUUID(), resourceKey, ownerId, ownerType, ownerLabel, urgency, utilityScore,
      status: ReservationStatus.ACTIVE, reservedAt: new Date(timestamp).toISOString(),
      expiresAt: new Date(timestamp + ttlMs).toISOString(), planStepId,
      parentReservationId,
      borrowDepth: 0,
      supersessionCount: 0,
      coordinationPressure: 0,
      emaPressure: 0,
      lastSupersededAt: new Date(timestamp).toISOString(),
      coordinationEnergy: 0,
    };
    this.active.set(resourceKey, reservation);
    this.clearRejection(resourceKey, ownerId);
    this.logger.debug(`[Reservation] GRANTED ${resourceKey} to ${ownerLabel} (${urgency})`);
    return reservation;
  }

  private promoteNext(resourceKey: string): void {
    const queue = this.waiting.get(resourceKey) ?? [];
    if (queue.length === 0) return;
    const next = queue.shift()!;
    this.waiting.set(resourceKey, queue);
    const ttl = this.ttlService?.getTTL(resourceKey) ?? DEFAULT_TTL_MS;
    const nowTimestamp = this.clock?.now() || Date.now();
    this.active.set(resourceKey, {
      id: next.requestId, resourceKey, ownerId: next.ownerId, ownerType: next.ownerType,
      ownerLabel: next.ownerLabel, urgency: next.urgency, utilityScore: next.utilityScore,
      status: ReservationStatus.ACTIVE, reservedAt: new Date(nowTimestamp).toISOString(),
      expiresAt: new Date(nowTimestamp + ttl).toISOString(),
      borrowDepth: 0,
      supersessionCount: 0,
      coordinationPressure: 0,
      emaPressure: 0,
      lastSupersededAt: new Date(nowTimestamp).toISOString(),
      coordinationEnergy: 0,
    });

    const waitMs = nowTimestamp - new Date(next.requestedAt).getTime();
    this.telemetry?.recordEvent('STARVATION_RECOVERY', resourceKey, next.ownerLabel, { 
      waitMs, 
      skipCount: next.skipCount 
    });

    this.logger.log(`[Reservation] PROMOTED ${next.ownerLabel} on ${resourceKey} (waited for ${next.skipCount} skips)`);
  }

  /** Archives reservation and clears any borrow rights registered against it. */
  private archiveReservation(r: ResourceReservation): void {
    this.history.set(r.id, r);
    this.borrows.delete(r.id); // Phase AT-1: borrow rights expire with parent
    if (this.history.size > this.MAX_HISTORY) {
      const oldest = [...this.history.entries()][0];
      if (oldest) this.history.delete(oldest[0]);
    }
  }

  // ── AU-1: Internals ───────────────────────────────────────────────────────

  private isOwnerInAncestry(ownerId: string, current: ResourceReservation): boolean {
    if (current.ownerId === ownerId) return true;
    if (current.parentReservationId) {
      const parent = this.history.get(current.parentReservationId) || 
                     [...this.active.values()].find(r => r.id === current.parentReservationId);
      if (parent) return this.isOwnerInAncestry(ownerId, parent);
    }
    return false;
  }

  // ── AU-2: Pressure Scoring ────────────────────────────────────────────────

  /**
   * Computes coordination pressure for a resource.
   * score = (borrowDepth / MAX_BORROW_DEPTH) * 0.4 
   *       + (waiterCount / 5) * 0.4 
   *       + (ageMs / TTL) * 0.2
   */
  private computeCoordinationPressure(resourceKey: string): number {
    const r = this.active.get(resourceKey);
    if (!r) return 0;

    const waiterCount = this.waiting.get(resourceKey)?.length ?? 0;
    const now = this.clock?.now() || Date.now();
    const start = new Date(r.reservedAt).getTime();
    const age = now - start;

    // Phase AW: Energy Budgeting update
    r.coordinationEnergy = Math.round((age / 1000) * (1 + r.borrowDepth) * (1 + r.supersessionCount));

    const depthComp = (r.borrowDepth / MAX_BORROW_DEPTH) * 0.4;
    const waitComp  = Math.min(1, waiterCount / 5) * 0.4;
    const ttl = new Date(r.expiresAt).getTime() - start;
    const ageComp   = Math.min(1, age / (ttl || 1)) * 0.2;

    const rawPressure = Math.min(1.0, depthComp + waitComp + ageComp);
    
    // Phase AU-5: EMA Smoothing (Hysteresis)
    const prevEma = r.emaPressure ?? rawPressure;
    const smoothed = (rawPressure * EMA_ALPHA) + (prevEma * (1 - EMA_ALPHA));
    r.emaPressure = Math.round(smoothed * 100) / 100;

    return Math.round(rawPressure * 100) / 100;
  }

  /** Lighter entropy calculation for circuit breaker. */
  private calculateCurrentEntropy(): number {
    const currentTimestamp = this.clock?.now() || Date.now();
    const active = [...this.active.values()];
    const totalWaiting = [...this.waiting.values()].reduce((s, q) => s + q.length, 0);
    const totalBorrows = active.filter(r => r.status === 'BORROWED').length;
    const avgChain = active.length > 0 ? active.reduce((s, r) => s + r.supersessionCount, 0) / active.length : 0;
    
    // Phase AW: Energy contribution to entropy
    const totalEnergy = active.reduce((s, r) => s + r.coordinationEnergy, 0);
    const energyRisk = Math.min(0.2, (totalEnergy / MAX_GLOBAL_ENERGY) * 0.2);

    return Math.min(1.0, (totalBorrows / 10) * 0.2 + (totalWaiting / 20) * 0.3 + (avgChain / 3) * 0.3 + energyRisk);
  }

  private getCurrentKernelMode(): KernelMode {
    if (!this.envelope) return KernelMode.THROUGHPUT;
    const entropy = this.calculateCurrentEntropy();
    const risk = this.envelope.calculateOscillationRisk();
    return this.envelope.recommendMode(entropy, risk);
  }

  private updateMode(newMode: KernelMode) {
    if (this.currentMode.mode !== newMode) {
      this.logger.warn(`[Reservation] KERNEL MODE TRANSITION: ${this.currentMode.mode} -> ${newMode}`);
      this.currentMode = { mode: newMode, startedAt: new Date().toISOString() };
      this.telemetry?.recordEvent('KERNEL_MODE_TRANSITION', 'GLOBAL', 'SYSTEM', { mode: newMode });
    }
  }

  private trackRejection(resourceKey: string, ownerId: string, urgency: string) {
    if (urgency === 'CRITICAL') {
      const key = `${resourceKey}:${ownerId}`;
      this.criticalRejections.set(key, (this.criticalRejections.get(key) ?? 0) + 1);
    }
  }

  private clearRejection(resourceKey: string, ownerId: string) {
    this.criticalRejections.delete(`${resourceKey}:${ownerId}`);
  }
}
