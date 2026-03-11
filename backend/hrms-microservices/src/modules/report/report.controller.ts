import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('attendance')
  generateAttendanceReport(@Query() filters: any) {
    return this.reportService.generateAttendanceReport(filters);
  }

  @Get('payroll')
  generatePayrollReport(@Query() filters: any) {
    return this.reportService.generatePayrollReport(filters);
  }

  @Get('leave')
  generateLeaveReport(@Query() filters: any) {
    return this.reportService.generateLeaveReport(filters);
  }

  @Get('recruitment')
  generateRecruitmentReport(@Query() filters: any) {
    return this.reportService.generateRecruitmentReport(filters);
  }
}
