import { Controller, Get, Query, UseGuards, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { TrialBalanceService } from './trial-balance.service';
import { DashboardAggregatorService } from './dashboard-aggregator.service';
import { LedgerReportService } from './ledger-report.service';
import { PayrollReportService } from './payroll-report.service';
import { StatutoryReportService } from './statutory-report.service';
import { ReconReportService } from './recon-report.service';
import { CsvExporter } from '../../common/utils/csv-exporter.util';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('reporting')
@UseGuards(RolesGuard)
export class ReportingController {
  constructor(
    private readonly trialBalanceService: TrialBalanceService,
    private readonly dashboardAggregatorService: DashboardAggregatorService,
    private readonly ledgerReportService: LedgerReportService,
    private readonly payrollReportService: PayrollReportService,
    private readonly statutoryReportService: StatutoryReportService,
    private readonly reconReportService: ReconReportService,
    private readonly csvExporter: CsvExporter
  ) {}

  @Get('trial-balance')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getTrialBalance(@Query('asOfDate') asOfDate: string, @Query('export') exportCsv: boolean, @Res() res: Response) {
    const data = await this.trialBalanceService.getReport(asOfDate ? new Date(asOfDate) : undefined);
    if (exportCsv) {
        const csv = await this.csvExporter.export(data.items);
        this.sendCsvResponse(res, csv, 'trial_balance.csv');
    } else {
        res.json(data);
    }
  }

  @Get('ledger-drill-down')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getLedgerDrillDown(
    @Query('accountCode') accountCode: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('export') exportCsv: boolean,
    @Res() res: Response
  ) {
    if (!accountCode || !startDate || !endDate) throw new BadRequestException('accountCode, startDate, and endDate are required');
    const data = await this.ledgerReportService.getAccountJournal(accountCode, new Date(startDate), new Date(endDate));
    if (exportCsv) {
        const csv = await this.csvExporter.export(data);
        this.sendCsvResponse(res, csv, `ledger_${accountCode}.csv`);
    } else {
        res.json(data);
    }
  }

  @Get('payroll-register')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  async getPayrollRegister(@Query('batchId') batchId: string, @Query('export') exportCsv: boolean, @Res() res: Response) {
    if (!batchId) throw new BadRequestException('batchId is required');
    const data = await this.payrollReportService.getBatchRegister(batchId);
    if (exportCsv) {
        const csv = await this.csvExporter.export(data.items);
        this.sendCsvResponse(res, csv, `payroll_register_${batchId}.csv`);
    } else {
        res.json(data);
    }
  }

  @Get('statutory-liability')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getStatutoryLiability(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('export') exportCsv: boolean,
    @Res() res: Response
  ) {
    if (!startDate || !endDate) throw new BadRequestException('startDate and endDate are required');
    const data = await this.statutoryReportService.getComplianceSummary(new Date(startDate), new Date(endDate));
    if (exportCsv) {
        const csv = await this.csvExporter.export(data);
        this.sendCsvResponse(res, csv, 'statutory_liability.csv');
    } else {
        res.json(data);
    }
  }

  private sendCsvResponse(res: Response, csv: string, filename: string) {
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
