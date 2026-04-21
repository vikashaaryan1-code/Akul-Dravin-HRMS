import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WalletEntity } from '../../database/entities/wallet.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { LedgerService } from './ledger.service';
import { LedgerAccountType } from '../../database/entities/ledger-account.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly dataSource: DataSource
  ) {}

  private get walletRepo() {
    return TenantContext.getRepository(WalletEntity);
  }

  async getBalance(employeeId?: string): Promise<{ balance: number }> {
    const wallet = await this.walletRepo.findOne({
      where: { 
        ...(employeeId ? { employeeId } : {})
      }
    });

    return { balance: wallet ? Number(wallet.balance) : 0 };
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
    const updatedAccount = await this.dataSource.getRepository(require('../../database/entities/ledger-account.entity').LedgerAccountEntity).findOne({
        where: { tenantId, code: walletAccountCode }
    });
    
    if (updatedAccount) {
        wallet.balance = updatedAccount.balance;
        await this.walletRepo.save(wallet);
    }

    return transaction;
  }
}
