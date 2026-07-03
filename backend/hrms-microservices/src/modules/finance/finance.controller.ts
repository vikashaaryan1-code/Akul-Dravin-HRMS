import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({ status: 200, description: 'Return all invoices.' })
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

  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'The invoice has been successfully created.' })
  @Post('invoices')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.SALES_MANAGER,
    Role.TEAM_MANAGER,
  )
  createInvoice(@Body() payload: CreateInvoiceDto) {
    return this.financeService.createInvoice({
      ...payload,
      amount: payload.amount?.toString()
    } as any);
  }

  @ApiOperation({ summary: 'Update invoice status' })
  @ApiResponse({ status: 200, description: 'The invoice status has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  @Patch('invoices/:id/status')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.SALES_MANAGER,
  )
  updateInvoiceStatus(@Param('id') id: string, @Body() payload: UpdateInvoiceStatusDto) {
    const updated = this.financeService.updateInvoiceStatus(id, payload.status ?? '');
    if (!updated) {
      throw new NotFoundException(`Finance invoice not found: ${id}`);
    }

    return updated;
  }

  @ApiOperation({ summary: 'Get all expenses' })
  @ApiResponse({ status: 200, description: 'Return all expenses.' })
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

  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'The expense has been successfully created.' })
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
  createExpense(@Body() payload: CreateExpenseDto) {
    return this.financeService.createExpense({
      ...payload,
      amount: payload.amount?.toString()
    } as any);
  }

  @ApiOperation({ summary: 'Get finance summary' })
  @ApiResponse({ status: 200, description: 'Return finance summary.' })
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
