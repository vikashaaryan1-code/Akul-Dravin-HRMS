import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'notifications' })
export class NotificationEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  channel!: string;

  @Column({ type: 'varchar', length: 60 })
  type!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'timestamp with time zone', name: 'scheduled_at', nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: 'timestamp with time zone', name: 'sent_at', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'varchar', length: 40, default: 'queued' })
  status!: string;
}
