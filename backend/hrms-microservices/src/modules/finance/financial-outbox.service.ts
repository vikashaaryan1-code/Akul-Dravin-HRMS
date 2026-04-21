import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { FinancialOutboxEntity, FinancialOutboxStatus } from '../../database/entities/financial-outbox.entity';
import { LedgerService } from './ledger.service';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class FinancialOutboxService {
  private readonly logger = new Logger(FinancialOutboxService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * TRANSACTIONAL EMIT
   * Saves a financial intent into the outbox.
   * MUST be called within an existing transaction.
   */
  async emit(manager: EntityManager, command: any, aggregateId: string): Promise<void> {
    const tenantId = TenantContext.getRequiredTenantId();
    
    const outbox = manager.create(FinancialOutboxEntity, {
      tenantId,
      aggregateId,
      commandType: command.type,
      payload: command,
      idempotencyKey: command.idempotencyKey,
      status: FinancialOutboxStatus.PENDING,
    });

    await manager.save(outbox);
  }

  /**
   * RELIABLE DISPATCHER
   * Background worker to process pending outbox entries.
   * Implements Exactly-Once semantics via Ledger idempotency.
   */
  async processPending(): Promise<void> {
    const tenantId = TenantContext.getRequiredTenantId();
    
    // We use a separate transaction per item processing
    const pendingItems = await this.dataSource.getRepository(FinancialOutboxEntity).find({
        where: { tenantId, status: FinancialOutboxStatus.PENDING },
        order: { createdAt: 'ASC' },
        take: 10
    });

    for (const item of pendingItems) {
        await this.processItemById(item.id);
    }
  }

  private async processItemById(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
        // High-concurrency lock: SKIP LOCKED prevents workers from colliding.
        const item = await manager
            .createQueryBuilder(FinancialOutboxEntity, 'outbox')
            .where('outbox.id = :id', { id })
            .setLock('pessimistic_write')
            .setOnLocked('skip')
            .getOne();

        if (!item || item.status !== FinancialOutboxStatus.PENDING) return;

        item.status = FinancialOutboxStatus.PROCESSING;
        await manager.save(item);

        try {
            // HANDSHAKE WITH TRUTH LAYER
            const tx = await this.ledgerService.executeTransaction(item.payload);
            
            // Mark as completed
            item.status = FinancialOutboxStatus.COMPLETED;
            item.processedAt = new Date();
            await manager.save(item);

            this.logger.log(`Outbox Success: Command ${item.idempotencyKey} committed to Ledger as ${tx.id}`);
        } catch (e) {
            item.status = FinancialOutboxStatus.FAILED;
            item.errorLog = e.message;
            item.retryCount += 1;
            
            // If retry count is low, we might move back to PENDING for automatic retry.
            if (item.retryCount < 3) {
                item.status = FinancialOutboxStatus.PENDING;
            }

            await manager.save(item);
            this.logger.error(`Outbox Failure: Command ${item.idempotencyKey} failed. Reason: ${e.message}`);
        }
    });
  }
}
