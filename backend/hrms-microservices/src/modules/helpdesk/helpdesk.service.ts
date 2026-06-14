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

  async getSlaStatus(tenantId?: string): Promise<{ name: string; value: number }[]> {
    const where = tenantId ? { tenantId } : {};
    const tickets = await this.ticketRepo.find({ where });

    const now = Date.now();
    let withinSla = 0;
    let nearBreach = 0;
    let breached = 0;

    for (const t of tickets) {
      if (t.status === 'resolved' || t.status === 'closed') {
        withinSla++;
        continue;
      }
      const ageHours = (now - new Date(t.createdAt).getTime()) / 3_600_000;
      const pct = ageHours / t.slaHours;
      if (pct >= 1) {
        breached++;
      } else if (pct >= 0.75) {
        nearBreach++;
      } else {
        withinSla++;
      }
    }

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
