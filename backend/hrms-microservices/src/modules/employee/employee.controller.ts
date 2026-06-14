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
import { EmployeeService } from './employee.service';
import { EmployeeLifecycleService } from './employee-lifecycle.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

/**
 * EMPLOYEE CONTROLLER
 *
 * REST surface for the Employee domain. Split into two concerns:
 *   1. CRUD          — create/read/update/delete employee records
 *   2. Lifecycle     — state-machine transitions per PRD §5.1.1
 *
 * Lifecycle endpoints are POST to make the intent explicit and auditable.
 * Each transition is idempotent at the DB level (validated by the
 * state machine guard in EmployeeLifecycleService).
 *
 * Route map:
 *   GET    /employees               → list all (tenant-scoped)
 *   GET    /employees/:id           → single employee
 *   POST   /employees               → create
 *   PATCH  /employees/:id           → update profile fields
 *   DELETE /employees/:id           → soft/hard remove
 *
 *   POST /employees/:id/lifecycle/onboard       → ONBOARDING
 *   POST /employees/:id/lifecycle/probation     → PROBATION
 *   POST /employees/:id/lifecycle/confirm       → CONFIRMED
 *   POST /employees/:id/lifecycle/promote       → PROMOTED
 *   POST /employees/:id/lifecycle/transfer      → TRANSFERRED
 *   POST /employees/:id/lifecycle/resign        → NOTICE_PERIOD
 *   POST /employees/:id/lifecycle/exit          → RESIGNED
 *   POST /employees/:id/lifecycle/terminate     → TERMINATED
 *   POST /employees/:id/lifecycle/suspend       → SUSPENDED
 *   POST /employees/:id/lifecycle/reinstate     → CONFIRMED (from SUSPENDED)
 *   POST /employees/:id/lifecycle/abscond       → ABSCONDED
 *   GET  /employees/:id/lifecycle               → lifecycle history
 */
@Controller('employees')
@UseGuards(RolesGuard)
export class EmployeeController {
  constructor(
    private readonly employeeService:   EmployeeService,
    private readonly lifecycleService:  EmployeeLifecycleService,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.employeeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeService.remove(id);
  }

  // ── Lifecycle — read ──────────────────────────────────────────────────────

  @Get(':id/lifecycle')
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

  /** ONBOARDING — offer accepted, join date set, not yet joined. */
  @Post(':id/lifecycle/onboard')
  @HttpCode(HttpStatus.OK)
  initiateOnboarding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { expectedJoinDate: string; probationDays?: number; actorId?: string },
  ) {
    return this.lifecycleService.initiateOnboarding(id, body);
  }

  /** PROBATION — employee physically joined. */
  @Post(':id/lifecycle/probation')
  @HttpCode(HttpStatus.OK)
  startProbation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { actualJoinDate: string; probationEndDate?: string; probationDays?: number; actorId?: string },
  ) {
    return this.lifecycleService.startProbation(id, body);
  }

  /** CONFIRMED — probation passed, employee confirmed. Generates Confirmation Letter. */
  @Post(':id/lifecycle/confirm')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      confirmationDate: string;
      revisedMonthlyCtc?: number;
      performanceRating?: string;
      note?: string;
      actorId?: string;
    },
  ) {
    return this.lifecycleService.confirm(id, body);
  }

  /** PROMOTED — designation/CTC change. Generates Promotion Letter. */
  @Post(':id/lifecycle/promote')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  promote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      newDesignation: string;
      effectiveDate: string;
      revisedMonthlyCtc?: number;
      newDepartmentId?: string;
      newManagerId?: string;
      note?: string;
      actorId?: string;
    },
  ) {
    return this.lifecycleService.promote(id, body);
  }

  /** TRANSFERRED — branch/department/manager change. Generates Transfer Letter. */
  @Post(':id/lifecycle/transfer')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      newBranchId?: string;
      newDepartmentId?: string;
      newManagerId?: string;
      effectiveDate: string;
      reason?: string;
      actorId?: string;
    },
  ) {
    return this.lifecycleService.transfer(id, body);
  }

  /** NOTICE_PERIOD — resignation accepted, serving notice. */
  @Post(':id/lifecycle/resign')
  @HttpCode(HttpStatus.OK)
  initiateResignation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      resignationDate: string;
      lastWorkingDay: string;
      noticePeriodDays?: number;
      reason?: string;
      actorId?: string;
    },
  ) {
    return this.lifecycleService.initiateResignation(id, body);
  }

  /** RESIGNED — notice period complete, full & final settled. Generates Experience + Relieving Letters. */
  @Post(':id/lifecycle/exit')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  processExit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      actualLastDay: string;
      fullFinalAmount?: number;
      note?: string;
      actorId?: string;
    },
  ) {
    return this.lifecycleService.processExit(id, body);
  }

  /** TERMINATED — company-initiated exit. Generates Termination Letter. */
  @Post(':id/lifecycle/terminate')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      effectiveDate: string;
      reason: string;
      terminationType?: string;
      note?: string;
      actorId?: string;
    },
  ) {
    return this.lifecycleService.terminate(id, body);
  }

  /** SUSPENDED — disciplinary or administrative hold. */
  @Post(':id/lifecycle/suspend')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      suspensionDate: string;
      reason: string;
      expectedReturnDate?: string;
      actorId?: string;
    },
  ) {
    return this.lifecycleService.suspend(id, body);
  }

  /** CONFIRMED — reinstate from SUSPENDED. */
  @Post(':id/lifecycle/reinstate')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  reinstate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reinstateDate: string; note?: string; actorId?: string },
  ) {
    return this.lifecycleService.reinstate(id, body);
  }

  /** ABSCONDED — employee went AWOL. */
  @Post(':id/lifecycle/abscond')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  markAbsconded(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reportedDate: string; actorId?: string },
  ) {
    return this.lifecycleService.markAbsconded(id, body);
  }
}
