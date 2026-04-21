import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('invoices')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
  )
  invoices() {
    return this.financeService.getInvoices();
  }

  createInvoice(@Body() payload: { invoiceNumber?: string; customerName?: string; amount?: number; status?: string; dueDate?: string }) {
    return this.financeService.createInvoice({
      ...payload,
      amount: payload.amount?.toString()
    } as any);
  }

  @Patch('invoices/:id/status')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.SALES_MANAGER,
  )
  updateInvoiceStatus(@Param('id') id: string, @Body() payload: { status?: string }) {
    const updated = this.financeService.updateInvoiceStatus(id, payload.status ?? '');
    if (!updated) {
      throw new NotFoundException(`Finance invoice not found: ${id}`);
    }

    return updated;
  }

  @Get('expenses')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
  )
  expenses() {
    return this.financeService.getExpenses();
  }

  @Post('expenses')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
  )
  createExpense(@Body() payload: { category?: string; amount?: number; ownerName?: string; status?: string; expenseDate?: string }) {
    return this.financeService.createExpense({
      ...payload,
      amount: payload.amount?.toString()
    } as any);
  }

  @Get('summary')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
  )
  summary() {
    return this.financeService.getSummary();
  }
}
