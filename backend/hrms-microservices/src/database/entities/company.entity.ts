import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'companies' })
export class CompanyEntity extends TenantScopedEntity {
  @Index({ unique: true })
  @Column({ name: 'tenant_code', type: 'varchar', length: 64 })
  tenantCode!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 190 })
  legalName!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 190 })
  displayName!: string;

  @Column({ type: 'varchar', length: 120 })
  industry!: string;

  @Column({ type: 'varchar', length: 80, default: 'India' })
  country!: string;

  @Column({ type: 'varchar', length: 80, default: 'Asia/Kolkata' })
  timezone!: string;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, any>;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status!: string;
}
