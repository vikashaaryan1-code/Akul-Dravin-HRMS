import {
  Controller,
  Post,
  Get,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { EmployeeImportExportService } from './employee-import-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

/**
 * EMPLOYEE IMPORT / EXPORT CONTROLLER
 *
 * POST /employees/import/preview   → parse CSV, return per-row validation
 * POST /employees/import/submit    → queue validated rows for async import
 * GET  /employees/export/csv       → download filtered CSV
 */
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeImportExportController {
  constructor(
    private readonly importExportService: EmployeeImportExportService,
  ) {}

  /**
   * STEP 1 — Preview: Upload CSV, receive validation report.
   * Client shows the report, user confirms, then hits /import/submit.
   */
  @Post('import/preview')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/i)) {
          return cb(new BadRequestException('Only .csv files are accepted'), false);
        }
        cb(null, true);
      },
    }),
  )
  async importPreview(
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.importExportService.parseAndValidateCsv(file.buffer);
  }

  /**
   * STEP 2 — Submit: Queue confirmed rows for background processing.
   * Body: { rows: ImportRow[] } — the validated rows from step 1.
   */
  @Post('import/submit')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER)
  @HttpCode(HttpStatus.ACCEPTED)
  async importSubmit(
    @Body() body: { rows: any[] },
    @Req() req: Request & { user?: { id: string } },
  ) {
    const actorId = req.user?.id ?? 'system';
    return this.importExportService.queueImport(body.rows, actorId);
  }

  /**
   * GET /employees/export/csv?department=Sales&status=active
   * Returns a streaming CSV download of filtered employee data.
   */
  @Get('export/csv')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER)
  async exportCsv(
    @Query('department') department?: string,
    @Query('status') status?: string,
    @Res({ passthrough: false }) res?: Response,
  ) {
    const buffer  = await this.importExportService.exportCsv({ department, status });
    const headers = this.importExportService.buildCsvHeaders('employees-export');
    if (res) {
      res.set(headers);
      res.end(buffer);
    }
  }
}
