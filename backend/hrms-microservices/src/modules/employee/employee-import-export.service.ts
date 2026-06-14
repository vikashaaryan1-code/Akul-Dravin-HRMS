import {
  Injectable,
  Logger,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// ─── Column map ───────────────────────────────────────────────────────────────
const CSV_HEADERS = [
  'employeeCode', 'firstName', 'lastName', 'workEmail', 'department',
  'designation', 'monthlyCtc', 'dateOfJoining', 'managerId',
  'attendancePolicy', 'payrollGroup', 'status',
];

const REQUIRED_IMPORT_FIELDS = ['firstName', 'workEmail', 'department', 'dateOfJoining'];

export interface ImportRow {
  rowIndex:  number;
  data:      Record<string, string>;
  errors:    string[];
  status:    'valid' | 'invalid' | 'duplicate';
}

export interface ImportPreviewResult {
  totalRows:     number;
  validRows:     number;
  invalidRows:   number;
  duplicateRows: number;
  rows:          ImportRow[];
  jobId?:        string;
}

@Injectable()
export class EmployeeImportExportService {
  private readonly logger = new Logger(EmployeeImportExportService.name);

  constructor(
    @InjectQueue('employee-import') private readonly importQueue: Queue,
  ) {}

  private get empRepo() {
    return TenantContext.getRepository(EmployeeEntity);
  }

  // ─── IMPORT ────────────────────────────────────────────────────────────────

  /**
   * Parse and validate uploaded CSV bytes.
   * Returns a preview with per-row validation results.
   */
  async parseAndValidateCsv(buffer: Buffer): Promise<ImportPreviewResult> {
    const text = buffer.toString('utf-8');
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new BadRequestException('CSV must have at least one data row');

    const headers = lines[0]
      .split(',')
      .map(h => h.trim().replace(/^"|"$/g, ''));

    // Load existing emails for duplicate check (tenant-scoped)
    const existing = await this.empRepo.find({ select: ['workEmail'] });
    const existingEmails = new Set(existing.map(e => e.workEmail?.toLowerCase()));

    const rows: ImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const data: Record<string, string> = {};
      headers.forEach((h, idx) => { data[h] = values[idx] ?? ''; });

      const errors: string[] = [];

      // Required field validation
      for (const field of REQUIRED_IMPORT_FIELDS) {
        if (!data[field]?.trim()) {
          errors.push(`${field} is required`);
        }
      }

      // Email format validation
      if (data['workEmail'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data['workEmail'])) {
        errors.push('workEmail is not a valid email address');
      }

      // Date format validation
      if (data['dateOfJoining'] && isNaN(Date.parse(data['dateOfJoining']))) {
        errors.push('dateOfJoining must be a valid date (YYYY-MM-DD)');
      }

      // Salary validation
      if (data['monthlyCtc'] && isNaN(Number(data['monthlyCtc']))) {
        errors.push('monthlyCtc must be a number');
      }

      const isDuplicate = existingEmails.has(data['workEmail']?.toLowerCase());
      const status: ImportRow['status'] =
        isDuplicate ? 'duplicate' : errors.length > 0 ? 'invalid' : 'valid';

      rows.push({ rowIndex: i, data, errors, status });
    }

    const validRows     = rows.filter(r => r.status === 'valid').length;
    const invalidRows   = rows.filter(r => r.status === 'invalid').length;
    const duplicateRows = rows.filter(r => r.status === 'duplicate').length;

    this.logger.log(
      `CSV_PARSE total=${rows.length} valid=${validRows} invalid=${invalidRows} duplicate=${duplicateRows}`,
    );

    return { totalRows: rows.length, validRows, invalidRows, duplicateRows, rows };
  }

  /**
   * Queue the valid rows for async background import.
   * Returns a job ID for progress polling.
   */
  async queueImport(rows: ImportRow[], actorId: string): Promise<{ jobId: string }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const validRows = rows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      throw new BadRequestException('No valid rows to import');
    }

    const job = await this.importQueue.add(
      'bulk-import-employees',
      { tenantId, actorId, rows: validRows.map(r => r.data) },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100 },
    );

    this.logger.log(`IMPORT_QUEUED jobId=${job.id} rows=${validRows.length} tenant=${tenantId}`);
    return { jobId: String(job.id) };
  }

  // ─── EXPORT ────────────────────────────────────────────────────────────────

  /**
   * Export employees as CSV bytes.
   * Supports field filtering and ordering.
   */
  async exportCsv(filters?: { department?: string; status?: string }): Promise<Buffer> {
    const where: Record<string, unknown> = {};
    if (filters?.department) where['department'] = filters.department;
    if (filters?.status)     where['status']     = filters.status;

    const employees = await this.empRepo.find({
      where: Object.keys(where).length ? where : undefined,
      order: { createdAt: 'ASC' },
    });

    const lines: string[] = [CSV_HEADERS.join(',')];

    for (const emp of employees) {
      const row = CSV_HEADERS.map(col => {
        const val = (emp as unknown as Record<string, unknown>)[col];
        const str = val == null ? '' : String(val);
        // Escape cells containing commas or quotes
        return str.includes(',') || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      });
      lines.push(row.join(','));
    }

    const csv = lines.join('\r\n');
    this.logger.log(`EXPORT_CSV rows=${employees.length}`);
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Returns CSV export headers for StreamableFile response.
   */
  buildCsvHeaders(filename = 'employees-export') {
    const ts = new Date().toISOString().slice(0, 10);
    return {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}-${ts}.csv"`,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }
}
