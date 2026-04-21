import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * RECONCILIATION GUARD EXCEPTION
 * Triggered when a downstream flow (Payroll, Payouts, Filings) attempts 
 * to consume a transaction that has not achieved external parity (RECONCILED).
 */
export class BlockedFlowException extends HttpException {
  constructor(transactionId: string, currentStatus: string) {
    super(
      {
        error: 'BlockedFlowError',
        message: `Downstream Flow Blocked: Transaction ${transactionId} is currently [${currentStatus}]. Only [RECONCILED] transactions can influence payouts or statutory results.`,
        transactionId,
        currentStatus,
      },
      HttpStatus.FORBIDDEN
    );
  }
}
