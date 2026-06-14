import { Injectable, Logger } from '@nestjs/common';

export interface GovernanceIncident {
  id:           string;
  targetHash:   string; // The state hash where failure occurred
  operatorId:   string;
  narrative:    string; // "The Causal Story"
  remediation:  string; // "The Promise"
  timestamp:    string;
}

/**
 * GOVERNANCE POSTMORTEM SERVICE — Phase Ω-Final
 * 
 * The "Ritual Ledger." 
 * Provides the protocol for metabolizing institutional failure. 
 * Allows humans to name, explain, and remediate deterministic 
 * decisions that failed to align with intent.
 */
@Injectable()
export class GovernancePostmortemService {
  private readonly logger = new Logger(GovernancePostmortemService.name);
  private incidents: Map<string, GovernanceIncident> = new Map();

  /**
   * Records a formal governance postmortem ritual.
   */
  recordPostmortem(incident: Omit<GovernanceIncident, 'timestamp'>) {
    const record = { ...incident, timestamp: new Date().toISOString() };
    this.incidents.set(incident.id, record);
    
    this.logger.error(`[Metabolism] FAILURE RITUAL COMPLETED for Incident ${incident.id}. Target Hash: ${incident.targetHash}`);
    this.logger.log(`[Metabolism] Causal Narrative: ${incident.narrative}`);
  }

  getIncidentHistory() {
    return Array.from(this.incidents.values());
  }

  getIncidentByHash(hash: string) {
    return Array.from(this.incidents.values()).find(i => i.targetHash === hash);
  }
}
