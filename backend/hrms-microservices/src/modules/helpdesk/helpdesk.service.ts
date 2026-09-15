import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HelpdeskTicketEntity,
  HelpdeskTicketPriority,
  HelpdeskTicketStatus,
} from '../../database/entities/helpdesk-ticket.entity';

interface CreateTicketDto {
  subject: string;
  description?: string;
  requesterName: string;
  requesterId?: string;
  department?: string;
  category?: string;
  priority?: HelpdeskTicketPriority;
  slaHours?: number;
  tenantId?: string;
}

interface UpdateTicketDto {
  subject?: string;
  description?: string;
  category?: string;
  priority?: HelpdeskTicketPriority;
  status?: HelpdeskTicketStatus;
  assignedToId?: string;
  slaHours?: number;
}

@Injectable()
export class HelpdeskService {
  private readonly logger = new Logger(HelpdeskService.name);

  constructor(
    @InjectRepository(HelpdeskTicketEntity)
    private readonly ticketRepo: Repository<HelpdeskTicketEntity>,
  ) {}

  // ── Queries ────────────────────────────────────────────────────────────────

  findAll(tenantId?: string): Promise<HelpdeskTicketEntity[]> {
    const where = tenantId ? { tenantId } : {};
    return this.ticketRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<HelpdeskTicketEntity> {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Helpdesk ticket ${id} not found`);
    return ticket;
  }

  findByRequester(requesterId: string): Promise<HelpdeskTicketEntity[]> {
    return this.ticketRepo.find({
      where: { requesterId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── SLA summary ────────────────────────────────────────────────────────────

  /**
   * Performance Optimization:
   * Replaced full in-memory entity fetching (`find({ where })`) with a single database-level
   * SQL conditional aggregation using `createQueryBuilder`.
   * Calculates SLA compliance metrics directly in PostgreSQL, eliminating memory overhead
   * and reducing network payload from O(N) ticket records to 1 summary result row.
   */
  async getSlaStatus(tenantId?: string): Promise<{ name: string; value: number }[]> {
    const qb = this.ticketRepo.createQueryBuilder('t');

    if (tenantId) {
      qb.where('t.tenantId = :tenantId', { tenantId });
    }

    const res = await qb
      .select(
        `SUM(CASE WHEN t.status IN ('resolved', 'closed') OR (EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600.0) / GREATEST(t.sla_hours, 1) < 0.75 THEN 1 ELSE 0 END)`,
        'withinSla',
      )
      .addSelect(
        `SUM(CASE WHEN t.status NOT IN ('resolved', 'closed') AND (EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600.0) / GREATEST(t.sla_hours, 1) >= 0.75 AND (EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600.0) / GREATEST(t.sla_hours, 1) < 1.0 THEN 1 ELSE 0 END)`,
        'nearBreach',
      )
      .addSelect(
        `SUM(CASE WHEN t.status NOT IN ('resolved', 'closed') AND (EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600.0) / GREATEST(t.sla_hours, 1) >= 1.0 THEN 1 ELSE 0 END)`,
        'breached',
      )
      .getRawOne();

    const withinSla = parseInt(res?.withinSla || res?.withinsla || '0', 10);
    const nearBreach = parseInt(res?.nearBreach || res?.nearbreach || '0', 10);
    const breached = parseInt(res?.breached || '0', 10);

    const total = withinSla + nearBreach + breached || 1;
    return [
      { name: 'Within SLA', value: Math.round((withinSla / total) * 100) },
      { name: 'Near Breach', value: Math.round((nearBreach / total) * 100) },
      { name: 'Breached',    value: Math.round((breached / total) * 100) },
    ];
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async create(dto: CreateTicketDto): Promise<HelpdeskTicketEntity> {
    const ticketNumber = `TCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const entity = this.ticketRepo.create({
      ticketNumber,
      subject:       dto.subject,
      description:   dto.description ?? null,
      requesterName: dto.requesterName,
      requesterId:   dto.requesterId ?? null,
      department:    dto.department ?? null,
      category:      dto.category ?? 'General',
      priority:      dto.priority ?? 'medium',
      slaHours:      dto.slaHours ?? 24,
      status:        'open',
      tenantId:      dto.tenantId!,
    });
    const saved = await this.ticketRepo.save(entity);
    this.logger.log(`HELPDESK_TICKET_CREATED id=${saved.id} ticket=${saved.ticketNumber}`);
    return saved;
  }

  async update(id: string, dto: UpdateTicketDto): Promise<HelpdeskTicketEntity> {
    const ticket = await this.findOne(id);

    const updates: Partial<HelpdeskTicketEntity> = { ...dto };

    // Auto-stamp timestamps on status transitions
    if (dto.status === 'resolved' && !ticket.resolvedAt) {
      updates.resolvedAt = new Date();
    }
    if (dto.status === 'closed' && !ticket.closedAt) {
      updates.closedAt = new Date();
    }

    await this.ticketRepo.update(id, updates);
    this.logger.log(`HELPDESK_TICKET_UPDATED id=${id} status=${dto.status ?? ticket.status}`);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // ensure exists
    await this.ticketRepo.delete(id);
    this.logger.log(`HELPDESK_TICKET_DELETED id=${id}`);
  }
}
