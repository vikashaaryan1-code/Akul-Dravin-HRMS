import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CrmService } from './crm.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStageDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateInteractionDto,
  LeadQueryDto,
} from './dto/crm.dto';
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

@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ── Leads ─────────────────────────────────────────────────────────────────────

  @Get('leads')
  @Roles(...CRM_ROLES)
  @ApiOperation({ summary: 'List CRM leads', description: 'Returns paginated leads for the tenant with optional filtering by stage and text search.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leads retrieved successfully' })
  getLeads(@Query() query: LeadQueryDto) {
    return this.crmService.getLeads(query);
  }

  @Get('leads/:id')
  @Roles(...CRM_ROLES)
  @ApiOperation({ summary: 'Get a single CRM lead by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lead returned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lead not found' })
  getLeadById(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.getLeadById(id);
  }

  @Post('leads')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Create a new CRM lead' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Lead created successfully' })
  createLead(@Body() payload: CreateLeadDto) {
    return this.crmService.createLead(payload);
  }

  @Patch('leads/:id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Update an existing CRM lead' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lead updated successfully' })
  updateLead(@Param('id', ParseUUIDPipe) id: string, @Body() payload: UpdateLeadDto) {
    return this.crmService.updateLead(id, payload);
  }

  @Patch('leads/:id/stage')
  @HttpCode(HttpStatus.OK)
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Move a lead to a new pipeline stage' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lead stage updated successfully' })
  updateLeadStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateLeadStageDto,
  ) {
    return this.crmService.updateLeadStage(id, payload.stage);
  }

  @Delete('leads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete a CRM lead' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Lead deleted successfully' })
  deleteLead(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.deleteLead(id);
  }

  // ── Customers ─────────────────────────────────────────────────────────────────

  @Get('customers')
  @Roles(...CRM_ROLES)
  @ApiOperation({ summary: 'List all CRM customers (accounts)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Customers retrieved successfully' })
  getCustomers() {
    return this.crmService.getCustomers();
  }

  @Get('customers/:id')
  @Roles(...CRM_ROLES)
  @ApiOperation({ summary: 'Get a single CRM customer by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Customer returned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Customer not found' })
  getCustomerById(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.getCustomerById(id);
  }

  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Create a new CRM customer account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Customer created successfully' })
  createCustomer(@Body() payload: CreateCustomerDto) {
    return this.crmService.createCustomer(payload);
  }

  @Patch('customers/:id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Update a CRM customer account' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Customer updated successfully' })
  updateCustomer(@Param('id', ParseUUIDPipe) id: string, @Body() payload: UpdateCustomerDto) {
    return this.crmService.updateCustomer(id, payload);
  }

  @Delete('customers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...CRM_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete a CRM customer account' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Customer deleted successfully' })
  deleteCustomer(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.deleteCustomer(id);
  }

  // ── Interactions ───────────────────────────────────────────────────────────────

  @Get('interactions')
  @Roles(...CRM_ROLES, Role.EMPLOYEE)
  @ApiOperation({ summary: 'List CRM interactions', description: 'Optionally filter by leadId or customerId.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Interactions retrieved successfully' })
  getInteractions(
    @Query('leadId') leadId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.crmService.getInteractions(leadId, customerId);
  }

  @Post('interactions')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...CRM_WRITE_ROLES, Role.TEAM_LEADER)
  @ApiOperation({ summary: 'Log a new CRM interaction' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Interaction logged successfully' })
  createInteraction(@Body() payload: CreateInteractionDto) {
    return this.crmService.createInteraction(payload);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────────

  @Get('pipeline/summary')
  @Roles(...CRM_ROLES)
  @ApiOperation({ summary: 'Get CRM pipeline summary', description: 'Returns lead counts by stage, total pipeline value, customer count, and total ARR.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pipeline summary returned successfully' })
  getPipelineSummary() {
    return this.crmService.getPipelineSummary();
  }
}
