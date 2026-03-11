import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('api/v1/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('employees')
  async exportEmployees(@Body() body: { data: any[]; format: 'pdf' | 'csv' }, @Res() res: Response) {
    const result = await this.exportService.exportEmployeeReport(body.data, body.format);
    
    if (body.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.pdf');
      res.send(result);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
      res.download(result as string);
    }
  }

  @Post('attendance')
  async exportAttendance(@Body() body: { data: any[]; format: 'pdf' | 'csv' }, @Res() res: Response) {
    const result = await this.exportService.exportAttendanceReport(body.data, body.format);
    
    if (body.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance.pdf');
      res.send(result);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
      res.download(result as string);
    }
  }

  @Post('payroll')
  async exportPayroll(@Body() body: { data: any[]; format: 'pdf' | 'csv' }, @Res() res: Response) {
    const result = await this.exportService.exportPayrollReport(body.data, body.format);
    
    if (body.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=payroll.pdf');
      res.send(result);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=payroll.csv');
      res.download(result as string);
    }
  }
}
