import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'analytics_events' })
export class AnalyticsEventEntity extends TenantScopedEntity {
  @Index()
  @Column({ type: 'varchar', length: 80 })
  module!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 120 })
  eventType!: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'event_payload', type: 'jsonb', default: () => "'{}'" })
  eventPayload!: Record<string, unknown>;
}
