import { Injectable, Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PayrollService } from '../payroll.service';
import { TaxEngineService } from '../tax-engine.service';
import { DomainEventService } from '../../../common/events/domain-event.service';
import { DocumentEngineService } from '../../document-center/document-engine.service';
import { LedgerService } from '../../finance/ledger.service';

@Processor('payroll-orchestration')
@Injectable()
export class PayrollOrchestratorWorker {
  private readonly logger = new Logger(PayrollOrchestratorWorker.name);

  constructor(
    private readonly payrollService: PayrollService,
    private readonly taxEngine: TaxEngineService,
    private readonly documentEngine: DocumentEngineService,
    private readonly ledgerService: LedgerService,
    private readonly eventBus: DomainEventService,
  ) {}

  /**
   * Autonomous "Zero-Touch" Payroll Batch Processor.
   * Handles calculation -> document generation -> ledger entry -> event publishing.
   */
  @Process('execute-batch')
  async executePayrollBatch(job: Job<{ batchId: string; tenantId: string }>) {
    const { batchId, tenantId } = job.data;
    this.logger.log(`AUTONOMOUS_PAYROLL starting for batchId=${batchId} tenant=${tenantId}`);

    try {
      // 1. Execute the batch calculations and ledger transactions
      const batch = await this.payrollService.executeBatch(batchId);
      this.logger.log(`Executed payroll items for batchId=${batchId}`);

      // 2. Finalize the batch (verify ledger reconciliation and update status to COMPLETED)
      const finalized = await this.payrollService.finalizeBatch(batchId);
      this.logger.log(`Finalized payroll batch COMPLETED for batchId=${batchId}`);

      return { success: true, processedCount: finalized.items?.length ?? 0 };

    } catch (error: any) {
      this.logger.error(`AUTONOMOUS_PAYROLL FAILED for batchId=${batchId}`, error.stack);
      
      // Self-healing: publish error event for automated recovery/alerting
      await this.eventBus.publish('PAYROLL_BATCH_FAILED', tenantId, {
        batchId,
        error: error.message,
      });

      throw error; // Let BullMQ handle the retry logic
    }
  }
}
