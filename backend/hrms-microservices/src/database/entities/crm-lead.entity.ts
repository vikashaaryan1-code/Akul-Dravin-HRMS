import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CrmInteractionEntity } from './crm-interaction.entity';

export type CrmLeadStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost'
  | 'Discovery Requested'
  | 'A2Z Workflow Requested';

export type CrmLeadSource =
  | 'Website'
  | 'Referral'
  | 'Cold Call'
  | 'LinkedIn'
  | 'Campaign'
  | 'Partner'
  | 'Other';

@Entity('crm_leads')
@Index(['tenantId', 'stage'])
@Index(['tenantId', 'ownerName'])
export class CrmLeadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'lead_name' })
  leadName: string;

  @Column({ type: 'varchar', nullable: true })
  organization: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ default: 'New' })
  stage: CrmLeadStage;

  @Column({ name: 'owner_name', type: 'varchar', nullable: true })
  ownerName: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({ type: 'varchar', nullable: true })
  source: CrmLeadSource;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'last_touch', type: 'timestamptz', nullable: true })
  lastTouch: Date | null;

  @Column({ name: 'expected_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  expectedValue: number | null;

  @Column({ name: 'company_id', type: 'varchar', nullable: true })
  companyId: string | null;

  @OneToMany(() => CrmInteractionEntity, (interaction) => interaction.lead, { cascade: ['insert'] })
  interactions: CrmInteractionEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
