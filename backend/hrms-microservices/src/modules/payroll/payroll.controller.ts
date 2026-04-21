import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollBatchEntity } from '../../database/entities/payroll-batch.entity';
import { PayrollItemEntity } from '../../database/entities/payroll-item.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CalculateTargetBasedSalaryDto } from './dto/calculate-target-based-salary.dto';
import { CalculateDaysWiseSalaryDto } from './dto/calculate-days-wise-salary.dto';
import { CalculateBonusSlaDto } from './dto/calculate-bonus-sla.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('batches')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  findAllBatches() {
    // Note: Implementation of findAllBatches in service might be needed if not existing
    return (this.payrollService as any).findAllBatches?.() ?? [];
  }

  @Post('batch')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  generateBatch(@Body() payload: { year: number; month: number }) {
    return this.payrollService.generateBatch(payload.year, payload.month);
  }

  @Post('batch/:id/lock')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  lockBatch(@Param('id') id: string) {
    return this.payrollService.lockBatch(id);
  }

  @Post('batch/:id/execute')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  executeBatch(@Param('id') id: string) {
    return this.payrollService.executeBatch(id);
  }

  @Post('batch/:id/bank-file')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  generateBankFile(@Param('id') id: string) {
    return this.payrollService.generateBankFile(id);
  }

  @Post('batch/:id/reverse')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  reverseBatch(@Param('id') id: string) {
    return this.payrollService.reverseBatch(id);
  }

  @Get('batch/:id/register')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  getPayrollRegister(@Param('id') id: string) {
    return this.payrollService.getPayrollRegister(id);
  }

  @Get('batch/:id/finalize')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  finalizeBatch(@Param('id') id: string) {
    return this.payrollService.finalizeBatch(id);
  }

  @Get(':id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Post('item/create')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  createItem(@Body() payload: Partial<PayrollItemEntity>) {
    // Note: This needs service update if we want manual item addition
    return (this.payrollService as any).createItem?.(payload);
  }

  @Patch('item/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  updateItem(@Param('id') id: string, @Body() payload: Partial<PayrollItemEntity>) {
     // Note: This needs service update if we want manual item updates
    return (this.payrollService as any).updateItem?.(id, payload);
  }

  @Post('calculate/target-based')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  calculateTargetBasedSalary(@Body() dto: CalculateTargetBasedSalaryDto) {
    return this.payrollService.calculateTargetBasedSalary(dto);
  }

  @Post('bonus/sla')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
  )
  calculateBonusSla(@Body() dto: CalculateBonusSlaDto) {
    return this.payrollService.calculateSixTierBonusSla(dto);
  }

  @Post('calculate/days-wise')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  calculateDaysWiseSalary(@Body() dto: CalculateDaysWiseSalaryDto) {
    return this.payrollService.calculateDaysWiseSalary(dto);
  }

  @Get('unified/:employeeId')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  calculateUnifiedSalary(@Param('employeeId') employeeId: string) {
    return this.payrollService.calculateUnifiedSalary(employeeId);
  }

  @Get('generate')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
  )
  generateMonthlyPayroll(@Query('month') month: string) {
    return this.payrollService.generateMonthlyPayroll(month);
  }

  @Get('employee/:employeeId')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.payrollService.findByEmployee(employeeId);
  }

  @Get('summary')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
  )
  getGlobalSummary() {
    return this.payrollService.getGlobalSummary();
  }

  @Get('analytics/departments')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
  )
  getDepartmentalSummary() {
    return this.payrollService.getDepartmentalSummary();
  }

  @Get('command-center')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  getCommandCenterOverview(@Query('asOfDate') asOfDate?: string) {
    return this.payrollService.getCommandCenterOverview(asOfDate ? new Date(asOfDate) : undefined);
  }
}

