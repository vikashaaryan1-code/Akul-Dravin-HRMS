import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollEntity } from '../../database/entities/payroll.entity';
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

  @Get()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  findAll() {
    return this.payrollService.findAll();
  }

  @Get(':id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Post()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  create(@Body() payload: Partial<PayrollEntity>) {
    return this.payrollService.create(payload);
  }

  @Patch(':id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  update(@Param('id') id: string, @Body() payload: Partial<PayrollEntity>) {
    return this.payrollService.update(id, payload);
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
}

