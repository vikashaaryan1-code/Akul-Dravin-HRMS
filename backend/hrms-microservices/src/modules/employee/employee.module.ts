import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { EmployeeController } from './employee.controller';
import { EmployeeImportExportController } from './employee-import-export.controller';
import { EmployeeService } from './employee.service';
import { EmployeeLifecycleService } from './employee-lifecycle.service';
import { EmployeeImportExportService } from './employee-import-export.service';
import { LifecycleOrchestratorService } from './lifecycle-orchestrator.service';
import { RolesGuard } from '../../common/guards/roles.guard';

import { BullModule } from '@nestjs/bull';
import { PayrollModule } from '../payroll/payroll.module';

/**
 * EMPLOYEE MODULE
 *
 * Provides:
 *   EmployeeService          — CRUD + tenant-scoped repository access
 *   EmployeeLifecycleService — State machine: ONBOARDING → EXIT (PRD §5.1.1)
 *
 * Exports both services so downstream modules (PayrollModule, LeaveModule,
 * DocumentCenterModule) can compose lifecycle queries without circular deps.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeEntity]),
    BullModule.registerQueue({ name: 'employee-import' }),
    forwardRef(() => PayrollModule),
  ],
  controllers: [EmployeeController, EmployeeImportExportController],
  providers:   [EmployeeService, EmployeeLifecycleService, EmployeeImportExportService, LifecycleOrchestratorService, RolesGuard],
  exports:     [EmployeeService, EmployeeLifecycleService],
})
export class EmployeeModule {}

