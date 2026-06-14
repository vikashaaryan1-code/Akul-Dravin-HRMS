import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { CrmLeadEntity } from './crm-lead.entity';
import { CrmCustomerEntity } from './crm-customer.entity';

export type InteractionChannel = 'Email' | 'Call' | 'Meeting' | 'WhatsApp' | 'Chat' | 'Other';
export type InteractionType =
  | 'Proposal Discussion'
  | 'Pricing Review'
  | 'Escalation'
  | 'Follow-up'
  | 'Demo'
  | 'Onboarding'
  | 'Support'
  | 'General';

@Entity('crm_interactions')
@Index(['tenantId', 'leadId'])
@Index(['tenantId', 'customerId'])
export class CrmInteractionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'lead_id', type: 'varchar', nullable: true })
  leadId: string | null;

  @Column({ name: 'customer_id', type: 'varchar', nullable: true })
  customerId: string | null;

  @Column({ name: 'customer_name', type: 'varchar', nullable: true })
  customerName: string | null;

  @Column({ default: 'Email' })
  channel: InteractionChannel;

  @Column({ name: 'interaction_type', default: 'General' })
  interactionType: InteractionType;

  @Column({ name: 'happened_at', type: 'timestamptz', default: () => 'NOW()' })
  happenedAt: Date;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => CrmLeadEntity, (lead) => lead.interactions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_id' })
  lead: CrmLeadEntity | null;

  @ManyToOne(() => CrmCustomerEntity, (customer) => customer.interactions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: CrmCustomerEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
