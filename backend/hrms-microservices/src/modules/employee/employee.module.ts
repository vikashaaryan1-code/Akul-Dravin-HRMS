import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeLifecycleService } from './employee-lifecycle.service';
import { RolesGuard } from '../../common/guards/roles.guard';

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
  imports: [TypeOrmModule.forFeature([EmployeeEntity])],
  controllers: [EmployeeController],
  providers:   [EmployeeService, EmployeeLifecycleService, RolesGuard],
  exports:     [EmployeeService, EmployeeLifecycleService],
})
export class EmployeeModule {}

