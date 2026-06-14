import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity, AuditAction } from '../../database/entities/audit-log.entity';

export interface AuditLogPayload {
  tenantId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepository: Repository<AuditLogEntity>,
  ) {}

  async log(payload: AuditLogPayload): Promise<void> {
    try {
      const entry = this.auditRepository.create({
        tenantId: payload.tenantId ?? null,
        actorId: payload.actorId ?? null,
        actorEmail: payload.actorEmail ?? null,
        actorRole: payload.actorRole ?? null,
        action: payload.action,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        oldValue: payload.oldValue ?? null,
        newValue: payload.newValue ?? null,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
        description: payload.description ?? null,
        metadata: payload.metadata ?? null,
      });
      await this.auditRepository.save(entry);
    } catch (err) {
      // Audit failures must NEVER break the main request
      this.logger.warn(`[AuditService] Failed to persist audit log: ${String(err)}`);
    }
  }

  async findAll(options?: {
    tenantId?: string;
    actorId?: string;
    entityType?: string;
    action?: AuditAction;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditLogEntity[]; total: number }> {
    const qb = this.auditRepository.createQueryBuilder('al');

    if (options?.tenantId) qb.andWhere('al.tenant_id = :tenantId', { tenantId: options.tenantId });
    if (options?.actorId) qb.andWhere('al.actor_id = :actorId', { actorId: options.actorId });
    if (options?.entityType) qb.andWhere('al.entity_type = :entityType', { entityType: options.entityType });
    if (options?.action) qb.andWhere('al.action = :action', { action: options.action });

    qb.orderBy('al.created_at', 'DESC')
      .take(options?.limit ?? 50)
      .skip(options?.offset ?? 0);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
