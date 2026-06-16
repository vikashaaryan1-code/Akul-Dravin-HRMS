import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VendorPurchaseOrderEntity } from './vendor-purchase-order.entity';

export type VendorStatus = 'Active' | 'Inactive' | 'Under Review' | 'Blacklisted';
export type VendorCategory =
  | 'Cloud Services'
  | 'Recruitment'
  | 'Marketing'
  | 'IT Hardware'
  | 'Software'
  | 'Logistics'
  | 'Facilities'
  | 'Legal'
  | 'Finance'
  | 'Other';

@Entity('vendors')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'category'])
export class VendorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'vendor_name' })
  vendorName: string;

  @Column({ type: 'varchar', nullable: true })
  category: VendorCategory;

  @Column({ type: 'varchar', name: 'contact_email', nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', name: 'contact_phone', nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', name: 'owner_name', nullable: true })
  ownerName: string | null;

  @Column({ default: 'Active' })
  status: VendorStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'varchar', name: 'tax_id', nullable: true })
  taxId: string | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'bank_details', type: 'jsonb', nullable: true })
  bankDetails: Record<string, unknown> | null;

  @Column({ type: 'uuid', name: 'company_id', nullable: true })
  companyId: string | null;

  @OneToMany(() => VendorPurchaseOrderEntity, (po) => po.vendor)
  purchaseOrders: VendorPurchaseOrderEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
