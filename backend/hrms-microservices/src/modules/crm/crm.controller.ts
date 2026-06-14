import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CrmService,
  CreateLeadDto,
  CreateCustomerDto,
  CreateInteractionDto,
  LeadQueryDto,
} from './crm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const CRM_ROLES = [
  Role.ROOT_OWNER,
  Role.PLATFORM_ADMIN,
  Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN,
  Role.SALES_MANAGER,
  Role.TEAM_MANAGER,
  Role.TEAM_LEADER,
  Role.RECRUITER,
];

const CRM_WRITE_ROLES = [
  Role.ROOT_OWNER,
  Role.PLATFORM_ADMIN,
  Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN,
  Role.SALES_MANAGER,
  Role.TEAM_MANAGER,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ── Leads ───────────────────────────────────────────────────────────────────

  @Get('leads')
  @Roles(...CRM_ROLES)
  getLeads(@Query() query: LeadQueryDto) {
    return this.crmService.getLeads(query);
  }

  @Get('leads/:id')
  @Roles(...CRM_ROLES)
  getLeadById(@Param('id') id: string) {
    return this.crmService.getLeadById(id);
  }

  @Post('leads')
  @Roles(...CRM_WRITE_ROLES)
  createLead(@Body() payload: CreateLeadDto) {
    return this.crmService.createLead(payload);
  }

  @Patch('leads/:id')
  @Roles(...CRM_WRITE_ROLES)
  updateLead(@Param('id') id: string, @Body() payload: Partial<CreateLeadDto>) {
    return this.crmService.updateLead(id, payload);
  }

  @Patch('leads/:id/stage')
  @Roles(...CRM_WRITE_ROLES)
  async updateLeadStage(@Param('id') id: string, @Body() payload: { stage?: string }) {
    return this.crmService.updateLeadStage(id, payload.stage ?? '');
  }

  @Delete('leads/:id')
  @Roles(...CRM_WRITE_ROLES)
  deleteLead(@Param('id') id: string) {
    return this.crmService.deleteLead(id);
  }

  // ── Customers ────────────────────────────────────────────────────────────────

  @Get('customers')
  @Roles(...CRM_ROLES)
  getCustomers() {
    return this.crmService.getCustomers();
  }

  @Get('customers/:id')
  @Roles(...CRM_ROLES)
  getCustomerById(@Param('id') id: string) {
    return this.crmService.getCustomerById(id);
  }

  @Post('customers')
  @Roles(...CRM_WRITE_ROLES)
  createCustomer(@Body() payload: CreateCustomerDto) {
    return this.crmService.createCustomer(payload);
  }

  @Patch('customers/:id')
  @Roles(...CRM_WRITE_ROLES)
  updateCustomer(@Param('id') id: string, @Body() payload: Partial<CreateCustomerDto>) {
    return this.crmService.updateCustomer(id, payload);
  }

  @Delete('customers/:id')
  @Roles(...CRM_WRITE_ROLES)
  deleteCustomer(@Param('id') id: string) {
    return this.crmService.deleteCustomer(id);
  }

  // ── Interactions ─────────────────────────────────────────────────────────────

  @Get('interactions')
  @Roles(...CRM_ROLES, Role.EMPLOYEE)
  getInteractions(
    @Query('leadId') leadId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.crmService.getInteractions(leadId, customerId);
  }

  @Post('interactions')
  @Roles(...CRM_WRITE_ROLES, Role.TEAM_LEADER)
  createInteraction(@Body() payload: CreateInteractionDto) {
    return this.crmService.createInteraction(payload);
  }

  // ── Analytics ────────────────────────────────────────────────────────────────

  @Get('pipeline/summary')
  @Roles(...CRM_ROLES)
  getPipelineSummary() {
    return this.crmService.getPipelineSummary();
  }
}
