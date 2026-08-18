import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WalletEntity } from '../../database/entities/wallet.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { LedgerService } from './ledger.service';
import { LedgerAccountType, LedgerAccountEntity } from '../../database/entities/ledger-account.entity';
import { randomUUID as uuidv4 } from 'crypto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly ledgerService: LedgerService,
    private readonly dataSource: DataSource
  ) {}

  private get walletRepo() {
    return TenantContext.getRepository(WalletEntity);
  }

  /**
   * GET BALANCE
   * Scoped to the current tenant — never leaks cross-tenant data.
   */
  async getBalance(employeeId?: string): Promise<{ balance: number; currency: string }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const wallet = await this.walletRepo.findOne({
      where: {
        tenantId,                                      // ← CRITICAL: always scope by tenant
        ...(employeeId ? { employeeId } : {}),
      },
    });
    return { balance: wallet ? Number(wallet.balance) : 0, currency: wallet?.currency ?? 'INR' };
  }

  /**
   * GET TRANSACTION HISTORY
   * Returns the last N ledger entries linked to the employee's wallet account.
   */
  async getHistory(employeeId?: string, take = 50): Promise<unknown[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    const wallet = await this.walletRepo.findOne({
      where: { ...(employeeId ? { employeeId } : {}), tenantId }
    });
    if (!wallet) return [];

    const walletAccountCode = `WLT-${wallet.id.substring(0, 8)}`;
    const account = await this.dataSource.getRepository(LedgerAccountEntity).findOne({
      where: { tenantId, code: walletAccountCode }
    });
    if (!account) return [];

    // Fetch ledger entries for this wallet account (debit or credit side)
    const entries = await this.dataSource.query(
      `SELECT le.*, lt.reference, lt.description AS tx_description
       FROM ledger_entries le
       JOIN ledger_transactions lt ON lt.id = le.transaction_id
       WHERE le.tenant_id = $1
         AND (le.debit_account_id = $2 OR le.credit_account_id = $2)
       ORDER BY le.created_at DESC
       LIMIT $3`,
      [tenantId, account.id, take]
    );
    return entries;
  }

  /**
   * REFACTORED CREDIT - THE TRUTH FLOW
   * Now exclusively uses the Atomic Transaction Executor.
   * No manual balance updates; no direct entry creation.
   */
  async credit(employeeId: string, amount: number, category: string, description: string) {
    const tenantId = TenantContext.getRequiredTenantId();
    
    // 1. Resolve Wallet Mirror
    let wallet = await this.walletRepo.findOne({ where: { employeeId } });

    if (!wallet) {
      wallet = this.walletRepo.create({
        employeeId,
        tenantId,
        balance: '0',
        currency: 'INR'
      });
      await this.walletRepo.save(wallet);
    }

    const walletAccountCode = `WLT-${wallet.id.substring(0, 8)}`;
    const systemCashAccountCode = 'SYS-CASH-POOL';

    // 2. Provision System Accounts (Idempotent)
    await this.ledgerService.ensureAccount(
      tenantId, 
      walletAccountCode, 
      `Wallet Account: ${employeeId}`, 
      LedgerAccountType.LIABILITY
    );

    await this.ledgerService.ensureAccount(
      tenantId, 
      systemCashAccountCode, 
      'Main Corporate Cash Pool', 
      LedgerAccountType.ASSET
    );

    // 3. EXECUTE TRUTH COMMAND
    // This is the SINGLE entry point for financial change. 
    // It handles locking, hashing, and state transitions.
    const transaction = await this.ledgerService.executeTransaction({
      idempotencyKey: `WLT-CREDIT-${wallet.id}-${uuidv4()}`,
      reference: category,
      type: 'WALLET_FUNDING',
      description,
      entries: [
        {
          debitAccountCode: walletAccountCode, // Liability Increases
          creditAccountCode: systemCashAccountCode, // Asset Decreases
          amount: amount.toString(),
          description: `Employee Credit: ${category}`
        }
      ]
    });

    // 4. Synchronize View Layer (Optional/Legacy synchronization)
    const updatedAccount = await this.dataSource.getRepository(LedgerAccountEntity).findOne({
        where: { tenantId, code: walletAccountCode }
    });
    
    if (updatedAccount) {
        wallet.balance = updatedAccount.balance;
        await this.walletRepo.save(wallet);
    }
  }

  /**
   * DEBIT — withdraw from employee wallet.
   * Mirrors the credit() pattern through the ledger engine.
   * Used for: loan EMI recovery, advance settlement, correction debits.
   */
  async debit(employeeId: string, amount: number, category: string, description: string) {
    const tenantId = TenantContext.getRequiredTenantId();

    const wallet = await this.walletRepo.findOne({ where: { employeeId, tenantId } });
    if (!wallet) throw new BadRequestException('Wallet not found for employee');
    if (Number(wallet.balance) < amount) throw new BadRequestException('Insufficient wallet balance');

    const walletAccountCode = `WLT-${wallet.id.substring(0, 8)}`;
    const systemCashAccountCode = 'SYS-CASH-POOL';

    await this.ledgerService.ensureAccount(tenantId, walletAccountCode, `Wallet Account: ${employeeId}`, LedgerAccountType.LIABILITY);
    await this.ledgerService.ensureAccount(tenantId, systemCashAccountCode, 'Main Corporate Cash Pool', LedgerAccountType.ASSET);

    const transaction = await this.ledgerService.executeTransaction({
      idempotencyKey: `WLT-DEBIT-${wallet.id}-${uuidv4()}`,
      reference: category,
      type: 'WALLET_WITHDRAWAL',
      description,
      entries: [
        {
          debitAccountCode: systemCashAccountCode,  // Asset increases (money returned to pool)
          creditAccountCode: walletAccountCode,      // Liability decreases
          amount: amount.toString(),
          description: `Employee Debit: ${category}`,
        },
      ],
    });

    // Sync view layer
    const updatedAccount = await this.dataSource.getRepository(LedgerAccountEntity).findOne({
      where: { tenantId, code: walletAccountCode },
    });
    if (updatedAccount) {
      wallet.balance = updatedAccount.balance;
      await this.walletRepo.save(wallet);
    }

    this.logger.log(`Wallet debit ${amount} from ${employeeId} — category: ${category}`);
    return transaction;
  }

  /**
   * RECHARGE TENANT CREDITS (SaaS Billing / Recruiter Hub)
   * High-level entry for recharging tenant-wide wallets (recruiter credits).
   */
  async rechargeTenantCredits(tenantId: string, amount: number, paymentMethod: string, reference: string) {
    const walletAccountCode = `TN-WLT-${tenantId.substring(0, 8)}`;
    const systemRevenueAccountCode = 'SYS-REVENUE-SUBSCRIPTION';

    await this.ledgerService.ensureAccount(tenantId, walletAccountCode, `Tenant Wallet: ${tenantId}`, LedgerAccountType.LIABILITY);
    await this.ledgerService.ensureAccount(tenantId, systemRevenueAccountCode, 'Subscription Revenue', LedgerAccountType.REVENUE);

    return this.ledgerService.executeTransaction({
      idempotencyKey: `RECH-${reference}`,
      reference: 'RECHARGE',
      type: 'TENANT_RECHARGE',
      description: `Recharge via ${paymentMethod}`,
      entries: [
        {
          debitAccountCode: systemRevenueAccountCode,
          creditAccountCode: walletAccountCode,
          amount: amount.toString(),
          description: `Credits Recharge: ${reference}`,
        },
      ],
    });
  }

  /**
   * DEDUCT TENANT CREDITS (Usage-Based Billing)
   * Deducts credits for marketplace actions (e.g., job postings).
   */
  async deductTenantCredits(tenantId: string, amount: number, action: string) {
    const walletAccountCode = `TN-WLT-${tenantId.substring(0, 8)}`;
    const systemExpenseAccountCode = 'SYS-MARKETPLACE-FEES';

    await this.ledgerService.ensureAccount(tenantId, walletAccountCode, `Tenant Wallet: ${tenantId}`, LedgerAccountType.LIABILITY);
    await this.ledgerService.ensureAccount(tenantId, systemExpenseAccountCode, 'Marketplace Usage Fees', LedgerAccountType.EXPENSE);

    const transaction = await this.ledgerService.executeTransaction({
      idempotencyKey: `USE-${tenantId}-${Date.now()}`,
      reference: action,
      type: 'USAGE_DEBIT',
      description: `Charge for ${action}`,
      entries: [
        {
          debitAccountCode: walletAccountCode,
          creditAccountCode: systemExpenseAccountCode,
          amount: amount.toString(),
          description: `Usage Charge: ${action}`,
        },
      ],
    });

    return { success: !!transaction, id: transaction.id };
  }
}
