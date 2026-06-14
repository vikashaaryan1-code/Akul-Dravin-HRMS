import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CrmInteractionEntity } from './crm-interaction.entity';

export type CustomerHealthStatus = 'Healthy' | 'At Risk' | 'Churned' | 'Expanding';

@Entity('crm_customers')
@Index(['tenantId'])
@Index(['tenantId', 'healthStatus'])
export class CrmCustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'account_name' })
  accountName: string;

  @Column({ type: 'varchar', nullable: true })
  industry: string | null;

  @Column({ name: 'owner_name', type: 'varchar', nullable: true })
  ownerName: string | null;

  @Column({ name: 'health_status', default: 'Healthy' })
  healthStatus: CustomerHealthStatus;

  @Column({ name: 'annual_value', type: 'decimal', precision: 15, scale: 2, default: 0 })
  annualValue: number;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ name: 'contract_end', type: 'date', nullable: true })
  contractEnd: string | null;

  @Column({ name: 'company_id', type: 'varchar', nullable: true })
  companyId: string | null;

  @OneToMany(() => CrmInteractionEntity, (interaction) => interaction.customer)
  interactions: CrmInteractionEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
