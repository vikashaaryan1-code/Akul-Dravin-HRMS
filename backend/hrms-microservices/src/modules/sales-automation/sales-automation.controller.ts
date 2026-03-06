import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CalculateSalesCommissionDto } from './dto/calculate-sales-commission.dto';
import { CreateCustomerAccountDto } from './dto/create-customer-account.dto';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateSalesDealDto } from './dto/create-sales-deal.dto';
import { CreateSalesTargetDto } from './dto/create-sales-target.dto';
import { ImportLeadsDto } from './dto/import-leads.dto';
import { UpdateCustomerAccountDto } from './dto/update-customer-account.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { UpdateSalesDealDto } from './dto/update-sales-deal.dto';
import { UpdateSalesTargetDto } from './dto/update-sales-target.dto';
import { SalesAutomationService } from './sales-automation.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales-automation')
export class SalesAutomationController {
  constructor(private readonly salesAutomationService: SalesAutomationService) {}

  @Get('leads')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAllLeads() {
    return this.salesAutomationService.findAllLeads();
  }

  @Get('leads/:id')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.RECRUITER,
    Role.EMPLOYEE,
  )
  findLead(@Param('id') id: string) {
    return this.salesAutomationService.findLead(id);
  }

  @Post('leads/capture')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  captureLead(@Body() dto: CreateLeadDto) {
    return this.salesAutomationService.captureLead(dto);
  }

  @Post('leads/import')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  importLeads(@Body() dto: ImportLeadsDto) {
    return this.salesAutomationService.importLeads(dto);
  }

  @Patch('leads/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  updateLead(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.salesAutomationService.updateLead(id, dto);
  }

  @Get('pipeline')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  pipelineBoard() {
    return this.salesAutomationService.getPipelineBoard();
  }

  @Patch('pipeline/stage')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  updatePipelineStage(@Body() dto: UpdatePipelineStageDto) {
    return this.salesAutomationService.updatePipelineStage(dto);
  }

  @Get('customers/accounts')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAllCustomerAccounts() {
    return this.salesAutomationService.findAllCustomerAccounts();
  }

  @Post('customers/accounts')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  createCustomerAccount(@Body() dto: CreateCustomerAccountDto) {
    return this.salesAutomationService.createCustomerAccount(dto);
  }

  @Patch('customers/accounts/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  updateCustomerAccount(@Param('id') id: string, @Body() dto: UpdateCustomerAccountDto) {
    return this.salesAutomationService.updateCustomerAccount(id, dto);
  }

  @Get('customers/contacts')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAllCustomerContacts() {
    return this.salesAutomationService.findAllCustomerContacts();
  }

  @Post('customers/contacts')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  createCustomerContact(@Body() dto: CreateCustomerContactDto) {
    return this.salesAutomationService.createCustomerContact(dto);
  }

  @Patch('customers/contacts/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  updateCustomerContact(@Param('id') id: string, @Body() dto: UpdateCustomerContactDto) {
    return this.salesAutomationService.updateCustomerContact(id, dto);
  }

  @Get('deals')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAllDeals() {
    return this.salesAutomationService.findAllDeals();
  }

  @Post('deals')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  createDeal(@Body() dto: CreateSalesDealDto) {
    return this.salesAutomationService.createDeal(dto);
  }

  @Patch('deals/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  updateDeal(@Param('id') id: string, @Body() dto: UpdateSalesDealDto) {
    return this.salesAutomationService.updateDeal(id, dto);
  }

  @Get('targets')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAllTargets() {
    return this.salesAutomationService.findAllTargets();
  }

  @Post('targets')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  createTarget(@Body() dto: CreateSalesTargetDto) {
    return this.salesAutomationService.createTarget(dto);
  }

  @Patch('targets/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  updateTarget(@Param('id') id: string, @Body() dto: UpdateSalesTargetDto) {
    return this.salesAutomationService.updateTarget(id, dto);
  }

  @Get('commissions')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  findAllCommissions() {
    return this.salesAutomationService.findAllCommissions();
  }

  @Post('commissions/calculate')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  calculateCommission(@Body() dto: CalculateSalesCommissionDto) {
    return this.salesAutomationService.calculateCommission(dto);
  }

  @Post('commissions/:id/sync-payroll')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  syncCommissionToPayroll(@Param('id') id: string) {
    return this.salesAutomationService.syncCommissionToPayroll(id);
  }

  @Get('analytics/summary')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  summary() {
    return this.salesAutomationService.getSalesAnalyticsSummary();
  }

  @Get('analytics/team-performance')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  teamPerformance() {
    return this.salesAutomationService.getSalesTeamPerformance();
  }
}
