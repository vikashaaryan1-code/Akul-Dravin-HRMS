import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { VendorPurchaseOrderEntity } from '../../database/entities/vendor-purchase-order.entity';
import { AuditLogService, AuditAction } from '../../common/audit/audit-log.service';

export interface CreateVendorDto {
  vendorName: string;
  category?: string;
  contactEmail?: string;
  contactPhone?: string;
  ownerName?: string;
  status?: string;
  rating?: number;
  taxId?: string;
  address?: string;
  bankDetails?: Record<string, unknown>;
}

export interface CreatePurchaseOrderDto {
  vendorId?: string;
  vendorName?: string;
  amount: number;
  currency?: string;
  status?: string;
  expectedDeliveryDate?: string;
  items?: Array<{ description: string; quantity: number; unitPrice: number }>;
  notes?: string;
}

@Injectable()
export class ProcurementVendorService {
  constructor(private readonly auditLog: AuditLogService) {}

  private get vendorRepo() {
    return TenantContext.getRepository(VendorEntity);
  }

  private get poRepo() {
    return TenantContext.getRepository(VendorPurchaseOrderEntity);
  }

  // ── Vendors ──────────────────────────────────────────────────────────────────

  async getVendors(): Promise<VendorEntity[]> {
    return this.vendorRepo.find({
      order: { rating: 'DESC', createdAt: 'DESC' },
    });
  }

  async getVendorById(id: string): Promise<VendorEntity> {
    const vendor = await this.vendorRepo.findOne({
      where: { id },
      relations: ['purchaseOrders'],
    });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return vendor;
  }

  async createVendor(payload: CreateVendorDto): Promise<VendorEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const vendor = this.vendorRepo.create({
      tenantId,
      vendorName: payload.vendorName?.trim(),
      category: (payload.category as VendorEntity['category']) ?? null,
      contactEmail: payload.contactEmail?.trim() ?? null,
      contactPhone: payload.contactPhone?.trim() ?? null,
      ownerName: payload.ownerName?.trim() ?? null,
      status: (payload.status as VendorEntity['status']) ?? 'Active',
      rating: Number(payload.rating ?? 0),
      taxId: payload.taxId?.trim() ?? null,
      address: payload.address?.trim() ?? null,
      bankDetails: payload.bankDetails ?? null,
    });
    const saved = await this.vendorRepo.save(vendor);
    this.auditLog.log(AuditAction.VENDOR_CREATED, {
      tenantId,
      resourceType: 'vendor',
      resourceId: saved.id,
      metadata: { vendorName: saved.vendorName, category: saved.category },
    }).catch(() => {});
    return saved;
  }

  async updateVendor(id: string, payload: Partial<CreateVendorDto>): Promise<VendorEntity> {
    const vendor = await this.getVendorById(id);
    const merged = this.vendorRepo.merge(vendor, payload as Partial<VendorEntity>);
    const saved = await this.vendorRepo.save(merged);
    this.auditLog.log(AuditAction.VENDOR_UPDATED, {
      tenantId: saved.tenantId,
      resourceType: 'vendor',
      resourceId: saved.id,
      metadata: { vendorName: saved.vendorName, changes: payload },
    }).catch(() => {});
    return saved;
  }

  async deleteVendor(id: string): Promise<void> {
    const vendor = await this.getVendorById(id);
    await this.vendorRepo.remove(vendor);
    this.auditLog.log(AuditAction.VENDOR_DELETED, {
      tenantId: vendor.tenantId,
      resourceType: 'vendor',
      resourceId: id,
      metadata: { vendorName: vendor.vendorName },
    }).catch(() => {});
  }

  // ── Purchase Orders ──────────────────────────────────────────────────────────

  async getPurchaseOrders(): Promise<VendorPurchaseOrderEntity[]> {
    return this.poRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['vendor'],
    });
  }

  async getPurchaseOrderById(id: string): Promise<VendorPurchaseOrderEntity> {
    const po = await this.poRepo.findOne({ where: { id }, relations: ['vendor'] });
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    return po;
  }

  async createPurchaseOrder(payload: CreatePurchaseOrderDto): Promise<VendorPurchaseOrderEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const po = this.poRepo.create({
      tenantId,
      poNumber,
      vendorId: payload.vendorId ?? null,
      vendorName: payload.vendorName?.trim() ?? null,
      amount: Number(payload.amount),
      currency: payload.currency ?? 'INR',
      status: (payload.status as VendorPurchaseOrderEntity['status']) ?? 'Draft',
      expectedDeliveryDate: payload.expectedDeliveryDate ?? null,
      items: payload.items ?? null,
      notes: payload.notes?.trim() ?? null,
    });
    const saved = await this.poRepo.save(po);
    this.auditLog.log(AuditAction.PURCHASE_ORDER_CREATED, {
      tenantId,
      resourceType: 'purchase_order',
      resourceId: saved.id,
      metadata: { poNumber: saved.poNumber, amount: saved.amount, vendorName: saved.vendorName },
    }).catch(() => {});
    return saved;
  }

  async updatePurchaseOrder(
    id: string,
    payload: Partial<CreatePurchaseOrderDto>,
  ): Promise<VendorPurchaseOrderEntity> {
    const po = await this.getPurchaseOrderById(id);
    const merged = this.poRepo.merge(po, payload as Partial<VendorPurchaseOrderEntity>);
    const saved = await this.poRepo.save(merged);
    this.auditLog.log(AuditAction.PURCHASE_ORDER_UPDATED, {
      tenantId: saved.tenantId,
      resourceType: 'purchase_order',
      resourceId: saved.id,
      metadata: { poNumber: saved.poNumber, changes: payload },
    }).catch(() => {});
    return saved;
  }

  async approvePurchaseOrder(id: string, approvedBy: string): Promise<VendorPurchaseOrderEntity> {
    const po = await this.updatePurchaseOrder(id, { status: 'Approved' });
    this.auditLog.log(AuditAction.PURCHASE_ORDER_APPROVED, {
      tenantId: po.tenantId,
      resourceType: 'purchase_order',
      resourceId: po.id,
      metadata: { poNumber: po.poNumber, approvedBy },
    }).catch(() => {});
    return po;
  }

  async rejectPurchaseOrder(id: string): Promise<VendorPurchaseOrderEntity> {
    const po = await this.updatePurchaseOrder(id, { status: 'Rejected' });
    this.auditLog.log(AuditAction.PURCHASE_ORDER_REJECTED, {
      tenantId: po.tenantId,
      resourceType: 'purchase_order',
      resourceId: po.id,
      metadata: { poNumber: po.poNumber },
    }).catch(() => {});
    return po;
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  async getSummary() {
    const [vendors, purchaseOrders] = await Promise.all([
      this.vendorRepo.find(),
      this.poRepo.find(),
    ]);

    const activeVendors = vendors.filter((v) => v.status === 'Active').length;
    const openPurchaseOrders = purchaseOrders.filter(
      (po) => ['Raised', 'Pending Approval', 'Approved'].includes(po.status),
    ).length;

    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyOrders = purchaseOrders.filter(
      (po) => po.createdAt.toISOString().startsWith(currentMonth),
    );
    const monthlySpend = monthlyOrders.reduce((sum, po) => sum + Number(po.amount), 0);

    return {
      activeVendors,
      openPurchaseOrders,
      monthlySpend,
      totalVendors: vendors.length,
      totalOrders: purchaseOrders.length,
    };
  }
}
