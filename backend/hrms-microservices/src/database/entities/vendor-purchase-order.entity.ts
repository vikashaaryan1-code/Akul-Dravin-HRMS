import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { VendorEntity } from './vendor.entity';

export type PurchaseOrderStatus =
  | 'Draft'
  | 'Raised'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Delivered'
  | 'Cancelled';

@Entity('vendor_purchase_orders')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'vendorId'])
export class VendorPurchaseOrderEntity extends TenantScopedEntity {
  @Column({ name: 'po_number', unique: false })
  poNumber: string;

  @Column({ type: 'uuid', name: 'vendor_id', nullable: true })
  vendorId: string | null;

  @Column({ type: 'varchar', name: 'vendor_name', nullable: true })
  vendorName: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({ default: 'Draft' })
  status: PurchaseOrderStatus;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'expected_delivery_date', type: 'date', nullable: true })
  expectedDeliveryDate: string | null;

  @Column({ type: 'jsonb', nullable: true })
  items: Array<{ description: string; quantity: number; unitPrice: number }> | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', name: 'company_id', nullable: true })
  companyId: string | null;

  @ManyToOne(() => VendorEntity, (vendor) => vendor.purchaseOrders, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity | null;
}
