import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { LoanService } from './loan.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance/loans')
export class LoansController {
  constructor(private readonly loanService: LoanService) {}

  @Get()
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.FINANCE_MANAGER,
  )
  findAll() {
    return this.loanService.findAll();
  }

  @Get('summary')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.FINANCE_MANAGER,
  )
  getSummary() {
    return this.loanService.getSummary();
  }

  @Patch(':id/status')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.FINANCE_MANAGER,
  )
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
  ) {
    return this.loanService.updateStatus(id, status);
  }
}
