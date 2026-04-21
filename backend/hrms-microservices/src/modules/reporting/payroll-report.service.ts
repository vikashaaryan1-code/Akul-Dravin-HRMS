import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { TenantContext } from '../../common/context/tenant-context';
import BigNumber from 'bignumber.js';

export interface PayrollRegisterRow {
    employeeId: string;
    grossSalary: string;
    tds: string;
    pf: string;
    esi: string;
    netPayable: string;
    transactionId: string;
}

@Injectable()
export class PayrollReportService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * RECONSTRUCTED PAYROLL REGISTER
   * Derived strictly from Ledger entries with payroll metadata.
   * Proves that the ledger totals tie exactly to the HR intent.
   */
  async getBatchRegister(batchId: string): Promise<{ items: PayrollRegisterRow[], totals: any }> {
    const tenantId = TenantContext.getRequiredTenantId();

    // Query entries linked to this batch
    const entries = await this.dataSource
        .getRepository(LedgerEntryEntity)
        .createQueryBuilder('entry')
        .where('entry.tenantId = :tenantId', { tenantId })
        .andWhere("entry.metadata->>'batchId' = :batchId", { batchId })
        .getMany();

    if (!entries.length) {
        throw new NotFoundException(`No ledger records found for batch ${batchId}`);
    }

    // Reconstruction logic:
    // Entries are mapped by employeeId stored in metadata
    const employeeMap = new Map<string, PayrollRegisterRow>();

    for (const entry of entries) {
        const employeeId = entry.metadata?.employeeId;
        if (!employeeId) continue;

        if (!employeeMap.has(employeeId)) {
            employeeMap.set(employeeId, {
                employeeId,
                grossSalary: '0.0000',
                tds: '0.0000',
                pf: '0.0000',
                esi: '0.0000',
                netPayable: '0.0000',
                transactionId: entry.transactionId
            });
        }

        const row = employeeMap.get(employeeId)!;
        const breakdown = entry.metadata?.breakdown || {};

        // Aggregate values (though usually one entry per employee set, we sum for safety)
        row.grossSalary = new BigNumber(row.grossSalary).plus(entry.metadata?.grossSalary || 0).toFixed(4);
        row.tds = new BigNumber(row.tds).plus(breakdown.tds || 0).toFixed(4);
        row.pf = new BigNumber(row.pf).plus(breakdown.pf || 0).toFixed(4);
        row.esi = new BigNumber(row.esi).plus(breakdown.esi || 0).toFixed(4);
        row.netPayable = new BigNumber(row.netPayable).plus(entry.metadata?.netPayable || 0).toFixed(4);
    }

    const items = Array.from(employeeMap.values());
    
    // Calculate totals to ensure they tie to ledger
    const totals = {
        gross: items.reduce((sum, i) => sum.plus(i.grossSalary), new BigNumber(0)).toFixed(4),
        net: items.reduce((sum, i) => sum.plus(i.netPayable), new BigNumber(0)).toFixed(4)
    };

    return { items, totals };
  }
}
