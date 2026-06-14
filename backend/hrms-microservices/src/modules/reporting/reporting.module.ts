import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { LedgerAccountEntity } from '../../database/entities/ledger-account.entity';
import { ExternalTransactionEntity } from '../../database/entities/external-transaction.entity';
import { ForensicAuditEntity } from '../../database/entities/forensic-audit.entity';
import { TrialBalanceService } from './trial-balance.service';
import { DashboardAggregatorService } from './dashboard-aggregator.service';
import { LedgerReportService } from './ledger-report.service';
import { PayrollReportService } from './payroll-report.service';
import { StatutoryReportService } from './statutory-report.service';
import { ReconReportService } from './recon-report.service';
import { ReportingController } from './reporting.controller';
import { CsvExporter } from '../../common/utils/csv-exporter.util';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ForensicAdvisoryService } from '../ai-engine/forensic-advisory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LedgerEntryEntity,
      LedgerAccountEntity,
      ExternalTransactionEntity,
      ForensicAuditEntity
    ]),
  ],
  controllers: [ReportingController],
  providers: [
    TrialBalanceService,
    DashboardAggregatorService,
    LedgerReportService,
    PayrollReportService,
    StatutoryReportService,
    ReconReportService,
    ForensicAdvisoryService,
    CsvExporter,
    RolesGuard
  ],
  exports: [
    TrialBalanceService,
    LedgerReportService,
    PayrollReportService,
    StatutoryReportService,
    ReconReportService
  ]
})
export class ReportingModule {}
