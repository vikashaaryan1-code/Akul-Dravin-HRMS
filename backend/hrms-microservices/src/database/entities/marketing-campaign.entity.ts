import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

export type MarketingChannel = 'Email' | 'WhatsApp' | 'SMS' | 'Push' | 'InApp';
export type MarketingCampaignStatus = 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed' | 'Cancelled';

@Entity({ name: 'marketing_campaigns' })
export class MarketingCampaignEntity extends TenantScopedEntity {
  @Column({ name: 'campaign_name', type: 'varchar', length: 255 })
  campaignName!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'channel',
    type: 'varchar',
    length: 30,
  })
  channel!: MarketingChannel;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    default: 'Draft',
  })
  status!: MarketingCampaignStatus;

  @Column({ name: 'audience_size', type: 'int', default: 0 })
  audienceSize!: number;

  @Column({ name: 'reach', type: 'int', default: 0 })
  reach!: number;

  @Column({ name: 'conversions', type: 'int', default: 0 })
  conversions!: number;

  /** Campaign spend in base currency units (e.g. INR) */
  @Column({ name: 'spend', type: 'decimal', precision: 14, scale: 2, default: 0 })
  spend!: number;

  @Index()
  @Column({ name: 'scheduled_at', type: 'timestamp with time zone', nullable: true })
  scheduledAt!: Date | null;

  @Column({ name: 'started_at', type: 'timestamp with time zone', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt!: Date | null;

  /** Creator / owner employee ID */
  @Index()
  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById!: string | null;
}
