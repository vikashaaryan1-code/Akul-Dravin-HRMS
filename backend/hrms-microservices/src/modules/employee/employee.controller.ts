import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { EmployeeLifecycleService } from './employee-lifecycle.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  OnboardEmployeeDto,
  StartProbationDto,
  ConfirmEmployeeDto,
  PromoteEmployeeDto,
  TransferEmployeeDto,
  InitiateResignationDto,
  ProcessExitDto,
  TerminateEmployeeDto,
  SuspendEmployeeDto,
  ReinstateEmployeeDto,
  MarkAbscondedDto,
} from './dto/lifecycle.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(RolesGuard)
export class EmployeeController {
  constructor(
    private readonly employeeService:   EmployeeService,
    private readonly lifecycleService:  EmployeeLifecycleService,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all employees for the current tenant' })
  @ApiResponse({ status: 200, description: 'List of employees' })
  findAll() {
    return this.employeeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific employee by ID' })
  @ApiResponse({ status: 200, description: 'Employee details' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'Employee successfully created' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing employee' })
  @ApiResponse({ status: 200, description: 'Employee successfully updated' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiResponse({ status: 204, description: 'Employee successfully deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeService.remove(id);
  }

  // ── Lifecycle — read ──────────────────────────────────────────────────────

  @Get(':id/lifecycle')
  @ApiOperation({ summary: 'Get lifecycle history of an employee' })
  @ApiResponse({ status: 200, description: 'Lifecycle state and history' })
  async getLifecycle(@Param('id', ParseUUIDPipe) id: string) {
    const employee = await this.employeeService.findOne(id);
    return {
      id,
      currentStage: this.lifecycleService.getCurrentStage(employee),
      isActive:     this.lifecycleService.isActive(employee),
      history:      this.lifecycleService.getLifecycleHistory(employee),
    };
  }

  // ── Lifecycle — transitions ───────────────────────────────────────────────

  @Post(':id/lifecycle/onboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate onboarding for a new hire' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to ONBOARDING' })
  initiateOnboarding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OnboardEmployeeDto,
  ) {
    return this.lifecycleService.initiateOnboarding(id, dto);
  }

  @Post(':id/lifecycle/probation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start probation period' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to PROBATION' })
  startProbation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartProbationDto,
  ) {
    return this.lifecycleService.startProbation(id, dto);
  }

  @Post(':id/lifecycle/confirm')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm an employee after probation' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to CONFIRMED' })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmEmployeeDto,
  ) {
    return this.lifecycleService.confirm(id, dto);
  }

  @Post(':id/lifecycle/promote')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Promote an employee' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to PROMOTED' })
  promote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PromoteEmployeeDto,
  ) {
    return this.lifecycleService.promote(id, dto);
  }

  @Post(':id/lifecycle/transfer')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer an employee' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to TRANSFERRED' })
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferEmployeeDto,
  ) {
    return this.lifecycleService.transfer(id, dto);
  }

  @Post(':id/lifecycle/resign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate resignation process' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to NOTICE_PERIOD' })
  initiateResignation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InitiateResignationDto,
  ) {
    return this.lifecycleService.initiateResignation(id, dto);
  }

  @Post(':id/lifecycle/exit')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process final exit of an employee' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to RESIGNED' })
  processExit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessExitDto,
  ) {
    return this.lifecycleService.processExit(id, dto);
  }

  @Post(':id/lifecycle/terminate')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate an employee' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to TERMINATED' })
  terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TerminateEmployeeDto,
  ) {
    return this.lifecycleService.terminate(id, dto);
  }

  @Post(':id/lifecycle/suspend')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend an employee' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to SUSPENDED' })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendEmployeeDto,
  ) {
    return this.lifecycleService.suspend(id, dto);
  }

  @Post(':id/lifecycle/reinstate')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reinstate a suspended employee' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned back from SUSPENDED' })
  reinstate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReinstateEmployeeDto,
  ) {
    return this.lifecycleService.reinstate(id, dto);
  }

  @Post(':id/lifecycle/abscond')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an employee as absconded' })
  @ApiResponse({ status: 200, description: 'Successfully transitioned to ABSCONDED' })
  markAbsconded(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkAbscondedDto,
  ) {
    return this.lifecycleService.markAbsconded(id, dto);
  }
}
