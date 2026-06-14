import { Column, Entity } from 'typeorm';
import { BaseEntityWithTimestamps } from './base.entity';

@Entity('a2z_workflows')
export class A2zWorkflowEntity extends BaseEntityWithTimestamps {
  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column('jsonb')
  steps!: any[];

  @Column({ default: true })
  isActive!: boolean;
}

@Entity('a2z_rollout_requests')
export class A2zRolloutRequestEntity extends BaseEntityWithTimestamps {
  @Column()
  workflowId!: string;

  @Column('jsonb')
  config!: any;

  @Column('jsonb', { nullable: true })
  status!: {
    step: string;
    progress: number;
    lastUpdated: Date;
  };

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  companyId?: string;
}

@Entity('a2z_marketplace_jobs')
export class A2zMarketplaceJobEntity extends BaseEntityWithTimestamps {
  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  category!: string; // 'BLUE_COLLAR', 'WHITE_COLLAR', 'GIG', 'FIELD'

  @Column({ nullable: true })
  location?: string;

  @Column('jsonb', { nullable: true })
  compensation?: {
    min: number;
    max: number;
    currency: string;
    type: 'HOURLY' | 'MONTHLY' | 'FIXED';
  };

  @Column('jsonb', { default: [] })
  requirements!: string[];

  @Column({ default: 'OPEN' })
  status!: 'OPEN' | 'CLOSED' | 'EXPIRED';

  @Column({ nullable: true })
  externalSource?: string; // 'LINKEDIN', 'WORKINDIA', 'INDEED'
}
