import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(@InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>) {}

  async create(data: any) {
    const log = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(log);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.entity) where.entity = filters.entity;
    return this.auditLogRepository.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }

  async log(userId: string, action: string, entity: string, entityId?: string, changes?: any) {
    return this.create({
      userId,
      action,
      entity,
      entityId,
      changes: changes ? JSON.stringify(changes) : null,
    });
  }
}
