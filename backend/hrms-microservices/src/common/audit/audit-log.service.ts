import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../database/entities/audit-log.entity';

export interface AuditContext {
  tenantId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export const AuditAction = {
  AUTH_LOGIN:                  'AUTH_LOGIN',
  AUTH_LOGIN_FAILED:           'AUTH_LOGIN_FAILED',
  AUTH_REGISTER:               'AUTH_REGISTER',
  AUTH_MFA_SETUP:              'AUTH_MFA_SETUP',
  PAYROLL_BATCH_ENQUEUED:      'PAYROLL_BATCH_ENQUEUED',
  PAYROLL_BATCH_COMPLETE:      'PAYROLL_BATCH_COMPLETE',
  PAYROLL_PAYSLIP_DOWNLOADED:  'PAYROLL_PAYSLIP_DOWNLOADED',
  LEAVE_APPLIED:               'LEAVE_APPLIED',
  LEAVE_APPROVED:              'LEAVE_APPROVED',
  LEAVE_REJECTED:              'LEAVE_REJECTED',
  EMPLOYEE_CREATED:            'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED:            'EMPLOYEE_UPDATED',
  VENDOR_CREATED:              'VENDOR_CREATED',
  VENDOR_UPDATED:              'VENDOR_UPDATED',
  VENDOR_DELETED:              'VENDOR_DELETED',
  PURCHASE_ORDER_CREATED:      'PURCHASE_ORDER_CREATED',
  PURCHASE_ORDER_UPDATED:      'PURCHASE_ORDER_UPDATED',
  PURCHASE_ORDER_APPROVED:     'PURCHASE_ORDER_APPROVED',
  PURCHASE_ORDER_REJECTED:     'PURCHASE_ORDER_REJECTED',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

/**
 * AuditLogService — append-only event trail.
 *
 * Usage:
 *   await auditLog.log('AUTH_LOGIN', { actorId: user.id, actorEmail: user.email, tenantId });
 *
 * Errors are swallowed with a WARN so they never break the primary flow.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async log(action: AuditActionType, ctx: AuditContext = {}): Promise<void> {
    try {
      const entry = this.repo.create({
        action,
        tenantId:     ctx.tenantId   ?? null,
        actorId:      ctx.actorId    ?? null,
        actorEmail:   ctx.actorEmail ?? null,
        resourceType: ctx.resourceType ?? null,
        resourceId:   ctx.resourceId   ?? null,
        metadata:     ctx.metadata     ?? null,
      });
      await this.repo.save(entry);
    } catch (err: unknown) {
      // Audit must NEVER break the caller.
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`AUDIT_LOG_WRITE_FAILED action=${action} err=${msg}`);
    }
  }

  /** HR / Admin use only — paginated audit trail */
  async findAll(tenantId: string, limit = 100, offset = 0): Promise<AuditLogEntity[]> {
    return this.repo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
