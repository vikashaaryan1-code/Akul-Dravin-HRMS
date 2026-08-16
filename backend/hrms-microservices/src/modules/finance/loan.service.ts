import { Injectable, NotFoundException } from '@nestjs/common';
import { LoanEntity } from '../../database/entities/loan.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';

@Injectable()
export class LoanService {
  constructor() {}

  private get loanRepository() {
    return TenantContext.getRepository(LoanEntity);
  }

  async findAll() {
    return this.loanRepository.find({
      order: { appliedAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const loan = await this.loanRepository.findOne({ where: { id } });
    if (!loan) {
      throw new NotFoundException(`Loan record ${id} not found.`);
    }
    return loan;
  }

  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const loan = await this.findOne(id);
    loan.status = status;
    return this.loanRepository.save(loan);
  }

  /**
   * Optimized summary calculation.
   * Replaces full in-memory array fetching (O(N) data transfer) with a single
   * database aggregation query via TypeORM QueryBuilder and TenantQueryPolicy governance.
   */
  async getSummary() {
    const tenantId = TenantContext.getRequiredTenantId();
    const qb = this.loanRepository.createQueryBuilder('loan');
    TenantQueryPolicy.enforce(qb, tenantId, 'loan', 'LoanService', 'getSummary');

    const raw = await qb
      .select([
        "SUM(CASE WHEN loan.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count",
        "SUM(CASE WHEN loan.status = 'PENDING' THEN loan.amount ELSE 0 END) AS pending_amount",
      ])
      .getRawOne();

    const totalPendingCount = parseInt(raw?.pending_count, 10) || 0;
    const totalPendingAmount = parseFloat(raw?.pending_amount) || 0;

    return {
      totalPendingCount,
      totalPendingAmount,
      currency: 'INR',
    };
  }
}
