import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { WalletsController } from './wallets.controller';
import { WalletService } from './wallet.service';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InvoiceEntity } from '../../database/entities/invoice.entity';
import { WalletEntity } from '../../database/entities/wallet.entity';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import { LoanEntity } from '../../database/entities/loan.entity';
import { LedgerAccountEntity } from '../../database/entities/ledger-account.entity';
import { LedgerTransactionEntity } from '../../database/entities/ledger-transaction.entity';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { ExternalTransactionEntity } from '../../database/entities/external-transaction.entity';
import { ForensicAuditEntity } from '../../database/entities/forensic-audit.entity';
import { FinancialOutboxEntity } from '../../database/entities/financial-outbox.entity';
import { LoanService } from './loan.service';
import { LoansController } from './loans.controller';
import { LedgerService } from './ledger.service';
import { ReconciliationService } from './reconciliation.service';
import { FinancialOutboxService } from './financial-outbox.service';
import { GlobalComplianceService } from './global-compliance.service';
import { PaymentOrchestrationService } from './payment-orchestration.service';
import { CommunicationModule } from '../communication/communication.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity, 
      WalletEntity, 
      TransactionEntity, 
      LoanEntity,
      LedgerAccountEntity,
      LedgerTransactionEntity,
      LedgerEntryEntity,
      ExternalTransactionEntity,
      ForensicAuditEntity,
      FinancialOutboxEntity
    ]),
    CommunicationModule,
  ],
  controllers: [FinanceController, WalletsController, LoansController, ReportingController],
  providers: [
    FinanceService, 
    WalletService, 
    LoanService, 
    LedgerService, 
    ReconciliationService, 
    FinancialOutboxService, 
    ReportingService,
    GlobalComplianceService,
    PaymentOrchestrationService,
    RolesGuard
  ],
  exports: [
    FinanceService, 
    WalletService, 
    LedgerService, 
    ReconciliationService, 
    FinancialOutboxService, 
    ReportingService,
    GlobalComplianceService,
    PaymentOrchestrationService
  ],
})
export class FinanceModule {}
