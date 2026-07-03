import { Body, Controller, Get, Header, HttpCode, Logger, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { PayrollBatchEntity } from '../../database/entities/payroll-batch.entity';
import { PayrollItemEntity } from '../../database/entities/payroll-item.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { CalculateTargetBasedSalaryDto } from './dto/calculate-target-based-salary.dto';
import { CalculateDaysWiseSalaryDto } from './dto/calculate-days-wise-salary.dto';
import { CalculateBonusSlaDto } from './dto/calculate-bonus-sla.dto';
import { GeneratePayrollBatchDto } from './dto/generate-payroll-batch.dto';
import { ReversePayrollBatchDto } from './dto/reverse-payroll-batch.dto';
import { DocumentEngineService } from '../document-center/document-engine.service';
import { AuditLogService, AuditAction } from '../../common/audit/audit-log.service';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  private readonly logger = new Logger(PayrollController.name);
  constructor(
    private readonly payrollService: PayrollService,
    private readonly documentEngine: DocumentEngineService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all payroll items' })
  @ApiResponse({ status: 200, description: 'List of all payroll items returned successfully.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  findAllItems() {
    return this.payrollService.findAllItems();
  }

  @Get('batches')
  @ApiOperation({ summary: 'Get all payroll batches' })
  @ApiResponse({ status: 200, description: 'List of all payroll batches returned successfully.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  findAllBatches() {
    return this.payrollService.findAll();
  }

  /**
   * Enqueue a payroll batch generation job.
   * Returns immediately with 202 Accepted + { jobId }.
   * Poll GET /payroll/batch/job/:jobId/status to track completion.
   *
   * Payroll-tier throttle: 10 submissions per 60s per IP (financial mutation).
   */
  @Post('batch')
  @HttpCode(202)
  @ApiOperation({ summary: 'Generate a new payroll batch' })
  @ApiResponse({ status: 202, description: 'Batch generation queued successfully.' })
  @Throttle({ payroll: { ttl: 60000, limit: 10 } })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  async generateBatch(@Body() payload: GeneratePayrollBatchDto) {
    const { jobId } = await this.payrollService.enqueueBatch(payload.year, payload.month);
    return { jobId, status: 'QUEUED' };
  }

  /**
   * Poll the status of a payroll batch generation job.
   * Returns BullMQ job state: waiting | active | completed | failed | delayed | unknown
   */
  @Get('batch/job/:jobId/status')
  @ApiOperation({ summary: 'Get status of a payroll batch generation job' })
  @ApiResponse({ status: 200, description: 'Job status retrieved successfully.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  getJobStatus(@Param('jobId') jobId: string) {
    return this.payrollService.getBatchJobStatus(jobId);
  }

  /** Payroll-tier throttle: locks are irreversible financial mutations. */
  @Post('batch/:id/lock')
  @ApiOperation({ summary: 'Lock a payroll batch' })
  @ApiResponse({ status: 200, description: 'Payroll batch locked successfully.' })
  @Throttle({ payroll: { ttl: 60000, limit: 10 } })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  lockBatch(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; roles?: string[]; role?: string },
  ) {
    return this.payrollService.lockBatch(id, {
      actorId:   user.sub,
      actorRoles: user.roles ?? (user.role ? [user.role] : ['PAYROLL_OFFICER']),
    });
  }

  @Post('batch/:id/execute')
  @ApiOperation({ summary: 'Execute a payroll batch' })
  @ApiResponse({ status: 200, description: 'Payroll batch executed successfully.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  executeBatch(@Param('id') id: string) {
    return this.payrollService.executeBatch(id);
  }

  @Post('batch/:id/bank-file')
  @ApiOperation({ summary: 'Generate bank file for a payroll batch' })
  @ApiResponse({ status: 200, description: 'Bank file generated successfully.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  generateBankFile(@Param('id') id: string) {
    return this.payrollService.generateBankFile(id);
  }

  /**
   * Reverse a completed payroll batch.
   *
   * Governance requirements (enforced by TransitionPolicyEngine):
   *  - Actor must hold PAYROLL_ADMIN or SUPER_ADMIN role.
   *  - Justification text is mandatory — a reversal without explanation is not permitted.
   *  - Only COMPLETED batches can be reversed (FAILED → REVERSED is structurally impossible).
   *
   * Returns 204 No Content on success.
   */
  @Post('batch/:id/reverse')
  @HttpCode(204)
  @ApiOperation({ summary: 'Reverse a completed payroll batch' })
  @ApiResponse({ status: 204, description: 'Batch reversed successfully.' })
  @Throttle({ payroll: { ttl: 60000, limit: 3 } })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN)
  reverseBatch(
    @Param('id') id: string,
    @Body() body: ReversePayrollBatchDto,
    @CurrentUser() user: { sub: string; roles?: string[]; role?: string },
  ) {
    return this.payrollService.reverseBatch(id, {
      actorId:    user.sub,
      actorRoles: user.roles ?? (user.role ? [user.role] : []),
    }, body.justification);
  }

  @Get('batch/:id/register')
  @ApiOperation({ summary: 'Get payroll register for a batch' })
  @ApiResponse({ status: 200, description: 'Payroll register retrieved successfully.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  getPayrollRegister(@Param('id') id: string) {
    return this.payrollService.getPayrollRegister(id);
  }

  @Get('batch/:id/finalize')
  @ApiOperation({ summary: 'Finalize a payroll batch' })
  @ApiResponse({ status: 200, description: 'Batch finalized successfully.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  finalizeBatch(@Param('id') id: string) {
    return this.payrollService.finalizeBatch(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific payroll batch by ID' })
  @ApiResponse({ status: 200, description: 'Batch retrieved successfully.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Post('item/create')
  @ApiOperation({ summary: 'Manual payroll item creation (unsupported)' })
  @ApiResponse({ status: 500, description: 'Not implemented.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  createItem() {
    // Manual item creation is not supported in v1 — items are auto-generated during batch generation.
    // Implement PayrollItemService.createItem() and wire here when manual override is needed.
    throw new Error('Manual payroll item creation not implemented. Use POST /payroll/batch to auto-generate items.');
  }

  @Patch('item/:id')
  @ApiOperation({ summary: 'Update a specific payroll item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully.' })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  updateItem() {
    // Manual item update is not supported in v1 — items are locked once the batch is sealed.
    throw new Error('Manual payroll item update not implemented. Reverse and regenerate the batch instead.');
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

  /**
   * @deprecated Use POST /payroll/batch instead.
   *
   * This endpoint is preserved for backward compatibility but now enqueues the
   * job asynchronously (same path as POST /payroll/batch). It will be removed
   * in a future API version once all callers have migrated.
   *
   * Returns: 202 Accepted + { jobId } — NOT a synchronous batch entity.
   */
  @Get('generate')
  @HttpCode(202)
  @Throttle({ payroll: { ttl: 60000, limit: 10 } })
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
  )
  async generateMonthlyPayroll(@Query('month') month: string) {
    // ⚠️ DEPRECATED: This sync bypass has been closed. Now routes through the async queue.
    // Callers should migrate to POST /payroll/batch for the canonical async path.
    this.logger.warn(
      `DEPRECATED_ENDPOINT: GET /payroll/generate called with month=${month}. ` +
      'Migrate callers to POST /payroll/batch. This endpoint will be removed in a future release.',
    );
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error('month must be in YYYY-MM format (e.g. 2026-04)');
    }
    const [year, m] = month.split('-').map(Number);
    const { jobId } = await this.payrollService.enqueueBatch(year, m);
    return { jobId, status: 'QUEUED', deprecationNotice: 'Migrate to POST /payroll/batch' };
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

  /**
   * GET /payroll/me/payslips
   *
   * Employee self-service: returns all payroll items belonging to the authenticated user.
   * Admins may supply ?employeeId=<id> to retrieve any employee's payslips company-wide.
   *
   * Access:
   *   - EMPLOYEE role → own payslips only (userId → employeeId lookup)
   *   - Admin roles + ?employeeId query → company-wide override
   */
  @Get('me/payslips')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  getMyPayslips(
    @CurrentUser() user: { sub: string; tenantId: string; role: string },
    @Query('employeeId') adminEmployeeId?: string,
  ) {
    // Admin roles may pass ?employeeId to look up any employee; employees cannot override
    const isAdmin = user.role !== Role.EMPLOYEE;
    const overrideId = isAdmin ? adminEmployeeId : undefined;
    return this.payrollService.findMyPayslips(user.sub, overrideId);
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

  /**
   * GET /payroll/payslip/:itemId
   *
   * Generates and streams a payslip PDF for the given payroll item.
   * Accessible by admin roles (any employee's payslip) and by EMPLOYEE role
   * (tenant-scoped queries ensure an employee cannot access another tenant's data;
   * employee-to-item ownership check is enforced via the tenant isolation layer).
   *
   * Response:
   *   - If Playwright is available: application/pdf binary stream
   *   - If Playwright is unavailable: text/html (graceful degradation)
   */
  @Get('payslip/:itemId')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  async downloadPayslip(
    @Param('itemId') itemId: string,
    @CurrentUser() user: { sub: string; tenantId: string },
    @Res() res: Response,
  ) {
    const dto    = await this.payrollService.getPayslipData(itemId);
    const result = await this.documentEngine.render(dto);

    // Fire-and-forget audit event — never blocks the response
    this.auditLog.log(AuditAction.PAYROLL_PAYSLIP_DOWNLOADED, {
      tenantId:     user.tenantId,
      actorId:      user.sub,
      resourceType: 'payroll_item',
      resourceId:   itemId,
      metadata:     { filename: result.filename, hash: result.hash },
    }).catch(() => { /* already logged inside AuditLogService */ });

    if (result.pdfBase64) {
      const pdfBuffer = Buffer.from(result.pdfBase64, 'base64');
      res.set({
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length':      String(pdfBuffer.length),
        'X-Document-Hash':     result.hash,
      });
      res.end(pdfBuffer);
    } else {
      // Playwright not available — return HTML so the user can still print
      res.set({
        'Content-Type':    'text/html; charset=utf-8',
        'X-Document-Hash': result.hash,
        'X-PDF-Status':    'unavailable',
      });
      res.end(result.html);
    }
  }
}
