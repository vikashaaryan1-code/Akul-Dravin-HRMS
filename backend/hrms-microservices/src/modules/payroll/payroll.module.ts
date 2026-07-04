import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PayrollBatchEntity } from '../../database/entities/payroll-batch.entity';
import { PayrollItemEntity } from '../../database/entities/payroll-item.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { BankFileArtifactEntity } from '../../database/entities/bank-file-artifact.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { TransitionJournalEntity } from '../../database/entities/transition-journal.entity';
import { AttendanceModule } from '../attendance/attendance.module';
import { PerformanceManagementModule } from '../performance-management/performance-management.module';
import { EmployeeModule } from '../employee/employee.module';
import { FinanceModule } from '../finance/finance.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditLogModule } from '../../common/audit/audit-log.module';
import { DocumentCenterModule } from '../document-center/document-center.module';
import { DomainEventModule } from '../../common/domain-events/domain-event.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollBatchProcessor } from './payroll-batch.processor';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QUEUE_PAYROLL } from '../../common/queues/queue-names';
import { TransitionPolicyEngine } from '../../common/governance/transitions/transition-policy-engine';
import { TaxEngineService } from './tax-engine.service';
import { PayrollCronService } from './payroll.cron';

/**
 * PayrollModule — Commit 5 (Governance Integration)
 *
 * TransitionPolicyEngine is now the sole legal mutation surface for
 * PayrollBatch.status. Raw status assignment outside the engine is
 * architectural debt and will be rejected by the enforcement test suite.
 *
 * Governance contract for payroll mutations:
 *   lockBatch()     → DRAFT → LOCKED      (PAYROLL_OFFICER+ required)
 *   executeBatch()  → LOCKED → PROCESSING (SYSTEM-originated)
 *   finalizeBatch() → PROCESSING → COMPLETED (SYSTEM-originated)
 *   reverseBatch()  → COMPLETED → REVERSED (PAYROLL_ADMIN+ + justification required)
 *
 * All transitions are:
 *   1. Validated against PAYROLL_TRANSITION_MAP (legality)
 *   2. Checked against TRANSITION_ROLE_MAP (RBAC)
 *   3. Journaled in payroll_transition_journal (immutable)
 *   4. Propagated via DomainEventBus (audit, activity, search, notifications)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollBatchEntity,
      PayrollItemEntity,
      EmployeeEntity,
      AttendanceEntity,
      BankFileArtifactEntity,
      CompanyEntity,
      TransitionJournalEntity,  // append-only transition journal
    ]),
    BullModule.registerQueue({ name: QUEUE_PAYROLL }),
    AttendanceModule,
    PerformanceManagementModule,
    forwardRef(() => EmployeeModule),
    FinanceModule,
    NotificationModule,
    AuditLogModule,
    DocumentCenterModule,
    DomainEventModule,           // provides DomainEventBus to TransitionPolicyEngine
  ],
  controllers: [PayrollController],
  providers:   [PayrollService, PayrollBatchProcessor, RolesGuard, TransitionPolicyEngine, TaxEngineService, PayrollCronService],
  exports:     [PayrollService, TaxEngineService, PayrollCronService],
})
export class PayrollModule {}
