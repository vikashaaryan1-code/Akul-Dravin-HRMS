import { Module, Global } from '@nestjs/common';
import { ResourceReservationService } from '../alerts/resource-reservation.service';
import { WorkflowDependencyAnalyzer } from '../alerts/workflow-dependency-analyzer.service';
import { WorkflowSimulator } from '../alerts/workflow-simulator.service';
import { AdaptiveTTLService } from '../alerts/adaptive-ttl.service';
import { WorkflowOutcomeService } from '../alerts/workflow-outcome.service';
import { CoordinationTelemetryService } from '../alerts/coordination-telemetry.service';
import { StabilityReplayService } from '../alerts/stability-replay.service';
import { StabilityEnvelopeService } from '../alerts/stability-envelope.service';
import { GovernanceConstitutionService } from '../alerts/governance-constitution.service';
import { RegulatorExplainabilityService } from '../alerts/regulator-explainability.service';
import { ConstitutionalRegistryService } from '../alerts/constitutional-registry.service';
import { ConstitutionalDriftService } from '../alerts/constitutional-drift.service';
import { GovernanceHasherService } from '../alerts/governance-hasher.service';
import { GovernanceSnapshotService } from '../alerts/governance-snapshot.service';
import { DeterministicReplaySandbox } from '../alerts/deterministic-replay-sandbox.service';
import { GovernanceClock, SystemGovernanceClock } from '../alerts/governance-clock.service';
import { GovernanceSovereigntyService } from '../alerts/governance-sovereignty.service';
import { GovernancePrecedenceRegistry } from '../alerts/governance-precedence-registry';
import { ReplayEquivalenceTester } from '../alerts/replay-equivalence-tester.service';
import { GovernanceFuzzingService } from '../alerts/governance-fuzzing.service';
import { GovernanceEconomicsService } from '../alerts/governance-economics.service';
import { GovernanceBudgetService } from '../alerts/governance-budget.service';
import { RegulatorInteractionService } from '../alerts/governance-calculus.service';
import { GovernanceComplexityGuard } from '../alerts/governance-complexity.guard';
import { GovernanceSimulationService } from '../alerts/governance-simulation.service';
import { ToolchainIntegrityService } from '../alerts/meta-verification.service';
import { GovernanceCompressionService } from '../alerts/governance-compression.service';
import { GovernanceMigrationSafeGuard } from '../alerts/governance-migration-safeguard';
import { GovernanceSkepticismEngine } from '../alerts/governance-skepticism.engine';
import { ConstitutionalSunsetService } from '../alerts/constitutional-sunset.service';
import { GovernancePostmortemService } from '../alerts/governance-postmortem.service';
import { ConstitutionalRollbackService } from '../alerts/constitutional-rollback.service';

/**
 * GOVERNANCE ORCHESTRATION MODULE — Phase AT
 * 
 * Centralizes the registration of orchestration services used by the 
 * governance control plane.
 * 
 * Services registered here provide the "coordination authority" 
 * (reservations, deadlocks, simulation) that sits above the 
 * "execution authority" (signal creation/processing).
 */
@Global()
@Module({
  providers: [
    ResourceReservationService,
    WorkflowDependencyAnalyzer,
    WorkflowSimulator,
    AdaptiveTTLService,
    WorkflowOutcomeService,
    CoordinationTelemetryService,
    StabilityReplayService,
    StabilityEnvelopeService,
    GovernanceConstitutionService,
    RegulatorExplainabilityService,
    ConstitutionalRegistryService,
    ConstitutionalDriftService,
    GovernanceHasherService,
    GovernanceSnapshotService,
    DeterministicReplaySandbox,
    GovernanceSovereigntyService,
    GovernancePrecedenceRegistry,
    ReplayEquivalenceTester,
    GovernanceFuzzingService,
    GovernanceEconomicsService,
    GovernanceBudgetService,
    RegulatorInteractionService,
    GovernanceComplexityGuard,
    GovernanceSimulationService,
    ToolchainIntegrityService,
    GovernanceCompressionService,
    GovernanceMigrationSafeGuard,
    GovernanceSkepticismEngine,
    ConstitutionalSunsetService,
    GovernancePostmortemService,
    ConstitutionalRollbackService,
    { provide: GovernanceClock, useClass: SystemGovernanceClock },
  ],
  exports: [
    ResourceReservationService,
    WorkflowDependencyAnalyzer,
    WorkflowSimulator,
    AdaptiveTTLService,
    WorkflowOutcomeService,
    CoordinationTelemetryService,
    StabilityReplayService,
    StabilityEnvelopeService,
    GovernanceConstitutionService,
    RegulatorExplainabilityService,
    ConstitutionalRegistryService,
    ConstitutionalDriftService,
    GovernanceHasherService,
    GovernanceSnapshotService,
    DeterministicReplaySandbox,
    GovernanceSovereigntyService,
    GovernancePrecedenceRegistry,
    ReplayEquivalenceTester,
    GovernanceFuzzingService,
    GovernanceEconomicsService,
    GovernanceBudgetService,
    RegulatorInteractionService,
    GovernanceComplexityGuard,
    GovernanceSimulationService,
    ToolchainIntegrityService,
    GovernanceCompressionService,
    GovernanceMigrationSafeGuard,
    GovernanceSkepticismEngine,
    ConstitutionalSunsetService,
    GovernancePostmortemService,
    ConstitutionalRollbackService,
    GovernanceClock,
  ],
})
export class GovernanceOrchestrationModule {}
