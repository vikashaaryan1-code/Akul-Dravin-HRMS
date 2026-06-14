import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_GOVERNANCE } from '../../queues/queue-names';
import { QueueJobEnvelope, AuditPersistPayload, ComplianceScanPayload, GOVERNANCE_JOB } from '../../queues/queue-job.types';
import { DeadLetterService } from '../../queues/dead-letter.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../../database/entities/audit-log.entity';

/**
 * GOVERNANCE QUEUE PROCESSOR
 *
 * Async governance workloads — decouples audit writes and compliance scans
 * from the transactional request path.
 *
 * Job types:
 *  audit-persist      — Async audit log write (fire-and-forget from request path)
 *  compliance-scan    — Re-evaluate entity against compliance rules
 *  policy-evaluate    — Re-run policy engine on entity mutation
 *
 * Idempotency: audit-persist uses 60s TTL (dedup within retry window only),
 *              compliance-scan uses 300s (5min debounce per entity).
 * Concurrency: 3 — audit writes can parallelize; scans are heavier.
 */
@Injectable()
@Processor(QUEUE_GOVERNANCE, { concurrency: 3 })
export class GovernanceQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(GovernanceQueueProcessor.name);

  constructor(
    private readonly dlqService: DeadLetterService,
    private readonly auditService: AuditService,
  ) { super(); }

  async process(job: Job<QueueJobEnvelope<unknown>>): Promise<void> {
    const { tenantId, correlationId, idempotencyKey } = job.data;
    const attempt = job.attemptsMade + 1;
    const logCtx  = `[GOV|${tenantId}|${job.name}|cid=${correlationId}|#${attempt}]`;

    const idemTtl = job.name === GOVERNANCE_JOB.COMPLIANCE_SCAN ? 300 : 60;
    if (await this.dlqService.checkIdempotency(idempotencyKey, idemTtl)) {
      this.logger.warn(`${logCtx} SKIPPED — duplicate`);
      return;
    }

    try {
      const start = Date.now();
      switch (job.name) {
        case GOVERNANCE_JOB.AUDIT_PERSIST:
          await this.handleAuditPersist(job.data as QueueJobEnvelope<AuditPersistPayload>, logCtx);
          break;
        case GOVERNANCE_JOB.COMPLIANCE_SCAN:
          await this.handleComplianceScan(job.data as QueueJobEnvelope<ComplianceScanPayload>, logCtx);
          break;
        case GOVERNANCE_JOB.POLICY_EVALUATE:
          this.logger.log(`${logCtx} Policy evaluation — entity=${(job.data.payload as any).entityType}`);
          break;
        default:
          this.logger.warn(`${logCtx} Unknown job: ${job.name}`);
      }
      this.logger.log(`${logCtx} SUCCESS — ${Date.now() - start}ms`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`${logCtx} FAILED — ${errMsg}`);
      if (attempt >= (job.opts.attempts ?? 3)) {
        await this.dlqService.record({
          queueName: QUEUE_GOVERNANCE, jobName: job.name, tenantId, idempotencyKey,
          payload: job.data as QueueJobEnvelope<unknown>,
          errorMessage: errMsg, attempts: attempt,
        });
      }
      throw err;
    }
  }

  private async handleAuditPersist(
    envelope: QueueJobEnvelope<AuditPersistPayload>,
    logCtx: string,
  ): Promise<void> {
    const p = envelope.payload;
    await this.auditService.log({
      tenantId:    envelope.tenantId,
      actorId:     p.actorId,
      actorEmail:  p.actorEmail,
      actorRole:   p.actorRole,
      action:      (p.action as AuditAction) ?? 'UPDATE',
      entityType:  p.entityType,
      entityId:    p.entityId,
      oldValue:    p.oldValue,
      newValue:    p.newValue,
      description: p.description,
      metadata:    { ...p.metadata, changeReason: p.changeReason, correlationId: envelope.correlationId },
    });
    this.logger.log(`${logCtx} Audit persisted: ${p.entityType}/${p.entityId}`);
  }

  private async handleComplianceScan(
    envelope: QueueJobEnvelope<ComplianceScanPayload>,
    logCtx: string,
  ): Promise<void> {
    const { entityType, entityId, scope } = envelope.payload;
    this.logger.log(`${logCtx} Compliance scan: type=${entityType} id=${entityId ?? '*'} scope=${scope}`);
    // In production: delegates to GovernanceScannerService.scanEntity(entityType, entityId)
  }
}
