/**
 * GOVERNANCE ALGORITHM REGISTRY — Phase BA
 * 
 * Defines the semantic versions of the kernel's internal logic engines.
 * This registry ensures that historical state is always evaluated against 
 * the correct version of the arbitration and entropy algorithms.
 */

export interface AlgorithmManifest {
  arbitrationVersion: number;
  entropyModelVersion: number;
  energyCalculatorVersion: number;
  stabilityEnvelopeVersion: number;
}

/**
 * The current canonical version manifest of the governance kernel.
 * Any change to the mathematical logic in ResourceReservationService 
 * MUST be accompanied by a version bump here.
 */
export const CURRENT_GOVERNANCE_MANIFEST: AlgorithmManifest = {
  arbitrationVersion: 1.0,      // Baseline utility arbitration
  entropyModelVersion: 1.1,     // Includes coordination energy
  energyCalculatorVersion: 1.0, // (Tenure * Depth * Churn)
  stabilityEnvelopeVersion: 1.0, // Oscillation risk mapping
};
