export interface LedgerEntryCommand {
  debitAccountCode: string;
  creditAccountCode: string;
  amount: string;
  description?: string;
}

export interface FinancialCommand {
  /**
   * MANDATORY IDEMPOTENCY KEY
   * Unique identifier for the command to prevent double-execution.
   */
  idempotencyKey: string;
  
  /**
   * TRANSACTION METADATA
   */
  reference: string;
  type: string;
  description?: string;
  
  /**
   * BALANCED ENTRIES
   */
  entries: LedgerEntryCommand[];
  
  /**
   * OPTIONAL CONTEXT
   */
  metadata?: any;
}
