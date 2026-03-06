import { Injectable } from '@nestjs/common';

type VendorRecord = {
  id: string;
  vendorName: string;
  category: string;
  ownerName: string;
  status: string;
  rating: number;
};

type PurchaseOrderRecord = {
  id: string;
  poNumber: string;
  vendorName: string;
  amount: number;
  status: string;
  expectedDeliveryDate: string;
};

type ProcurementSummaryRecord = {
  activeVendors: number;
  openPurchaseOrders: number;
  monthlySpend: number;
  savingsRealized: number;
};

@Injectable()
export class ProcurementVendorService {
  private readonly vendors: VendorRecord[] = [
    {
      id: 'VND-1',
      vendorName: 'CloudStack Infra',
      category: 'Cloud Services',
      ownerName: 'Finance Ops',
      status: 'Active',
      rating: 4.6,
    },
    {
      id: 'VND-2',
      vendorName: 'TalentEdge Events',
      category: 'Recruitment',
      ownerName: 'HR Ops',
      status: 'Active',
      rating: 4.3,
    },
    {
      id: 'VND-3',
      vendorName: 'ReachBoost Media',
      category: 'Marketing',
      ownerName: 'Growth Team',
      status: 'Under Review',
      rating: 3.8,
    },
  ];

  private readonly purchaseOrders: PurchaseOrderRecord[] = [
    {
      id: 'PO-1',
      poNumber: 'PO-2026-1901',
      vendorName: 'CloudStack Infra',
      amount: 126000,
      status: 'Approved',
      expectedDeliveryDate: '2026-03-21',
    },
    {
      id: 'PO-2',
      poNumber: 'PO-2026-1902',
      vendorName: 'TalentEdge Events',
      amount: 48000,
      status: 'Pending Approval',
      expectedDeliveryDate: '2026-03-18',
    },
    {
      id: 'PO-3',
      poNumber: 'PO-2026-1903',
      vendorName: 'ReachBoost Media',
      amount: 62000,
      status: 'Raised',
      expectedDeliveryDate: '2026-03-26',
    },
  ];

  private readonly summary: ProcurementSummaryRecord = {
    activeVendors: 2,
    openPurchaseOrders: 2,
    monthlySpend: 236000,
    savingsRealized: 18400,
  };

  getVendors(): VendorRecord[] {
    return this.vendors;
  }

  getPurchaseOrders(): PurchaseOrderRecord[] {
    return this.purchaseOrders;
  }

  getSummary(): ProcurementSummaryRecord {
    return this.summary;
  }
}
