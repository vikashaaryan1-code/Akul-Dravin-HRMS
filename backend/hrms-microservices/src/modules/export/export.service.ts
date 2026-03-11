import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportService {
  async generatePDF(data: any[], title: string, columns: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text(title, { align: 'center' });
      doc.moveDown();

      doc.fontSize(10);
      data.forEach((row, index) => {
        columns.forEach((col) => {
          doc.text(`${col}: ${row[col] || 'N/A'}`);
        });
        doc.moveDown();
        if (index < data.length - 1) doc.text('---');
      });

      doc.end();
    });
  }

  async generateCSV(data: any[], columns: { id: string; title: string }[], filename: string): Promise<string> {
    const filepath = path.join(process.cwd(), 'exports', filename);
    
    if (!fs.existsSync(path.join(process.cwd(), 'exports'))) {
      fs.mkdirSync(path.join(process.cwd(), 'exports'));
    }

    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: columns,
    });

    await csvWriter.writeRecords(data);
    return filepath;
  }

  async exportEmployeeReport(employees: any[], format: 'pdf' | 'csv'): Promise<Buffer | string> {
    const columns = ['id', 'fullName', 'email', 'department', 'designation', 'status'];
    
    if (format === 'pdf') {
      return await this.generatePDF(employees, 'Employee Report', columns);
    } else {
      return await this.generateCSV(
        employees,
        columns.map((col) => ({ id: col, title: col.toUpperCase() })),
        `employees_${Date.now()}.csv`
      );
    }
  }

  async exportAttendanceReport(attendance: any[], format: 'pdf' | 'csv'): Promise<Buffer | string> {
    const columns = ['employeeName', 'date', 'checkIn', 'checkOut', 'status'];
    
    if (format === 'pdf') {
      return await this.generatePDF(attendance, 'Attendance Report', columns);
    } else {
      return await this.generateCSV(
        attendance,
        columns.map((col) => ({ id: col, title: col.toUpperCase() })),
        `attendance_${Date.now()}.csv`
      );
    }
  }

  async exportPayrollReport(payroll: any[], format: 'pdf' | 'csv'): Promise<Buffer | string> {
    const columns = ['employeeName', 'month', 'basicSalary', 'deductions', 'netSalary'];
    
    if (format === 'pdf') {
      return await this.generatePDF(payroll, 'Payroll Report', columns);
    } else {
      return await this.generateCSV(
        payroll,
        columns.map((col) => ({ id: col, title: col.toUpperCase() })),
        `payroll_${Date.now()}.csv`
      );
    }
  }
}
