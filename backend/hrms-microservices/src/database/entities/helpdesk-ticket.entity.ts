import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

export type HelpdeskTicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type HelpdeskTicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed' | 'escalated';

@Entity({ name: 'helpdesk_tickets' })
export class HelpdeskTicketEntity extends TenantScopedEntity {
  @Column({ name: 'ticket_number', type: 'varchar', length: 50, unique: true })
  ticketNumber!: string;

  @Column({ name: 'subject', type: 'varchar', length: 255 })
  subject!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({ name: 'requester_id', type: 'uuid', nullable: true })
  requesterId!: string | null;

  @Column({ name: 'requester_name', type: 'varchar', length: 150 })
  requesterName!: string;

  @Column({ name: 'department', type: 'varchar', length: 100, nullable: true })
  department!: string | null;

  @Column({ name: 'category', type: 'varchar', length: 100, default: 'General' })
  category!: string;

  @Column({
    name: 'priority',
    type: 'varchar',
    length: 20,
    default: 'medium',
  })
  priority!: HelpdeskTicketPriority;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    default: 'open',
  })
  status!: HelpdeskTicketStatus;

  /** SLA target in hours */
  @Column({ name: 'sla_hours', type: 'int', default: 24 })
  slaHours!: number;

  @Index()
  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  assignedToId!: string | null;

  @Column({ name: 'resolved_at', type: 'timestamp with time zone', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
  closedAt!: Date | null;
}
