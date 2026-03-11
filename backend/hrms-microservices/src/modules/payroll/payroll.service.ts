import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payslip } from '../../database/entities/payslip.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Payslip)
    private payslipRepository: Repository<Payslip>,
  ) {}

  async generate(data: any) {
    const basicSalary = parseFloat(data.basicSalary);
    const hra = basicSalary * 0.4;
    const allowances = parseFloat(data.allowances || 0);
    const bonus = parseFloat(data.bonus || 0);
    const grossSalary = basicSalary + hra + allowances + bonus;

    // AI-Enhanced PF Calculation
    const pfRate = await this.calculateAIPFRate(data.employeeId, basicSalary, data.age, data.yearsOfService);
    const pf = basicSalary * pfRate;
    
    const esi = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;
    const tds = grossSalary > 50000 ? grossSalary * 0.1 : 0;
    
    // Apply attendance deductions
    const attendanceDeduction = await this.calculateAttendanceDeduction(data.employeeId, data.month, data.year, grossSalary);
    
    const otherDeductions = parseFloat(data.otherDeductions || 0);
    const totalDeductions = pf + esi + tds + otherDeductions + attendanceDeduction;

    const netSalary = grossSalary - totalDeductions;

    const payslip = this.payslipRepository.create({
      ...data,
      basicSalary,
      hra,
      allowances,
      bonus,
      grossSalary,
      pf,
      esi,
      tds,
      otherDeductions,
      attendanceDeduction,
      totalDeductions,
      netSalary,
      status: 'generated',
      generatedAt: new Date(),
    });

    return this.payslipRepository.save(payslip);
  }

  private async calculateAIPFRate(employeeId: string, basicSalary: number, age: number, yearsOfService: number): Promise<number> {
    // AI logic: adjust PF rate based on employee profile
    let pfRate = 0.12; // Default 12%
    
    if (age > 50) pfRate = 0.14; // Higher for senior employees
    if (yearsOfService > 10) pfRate += 0.01; // Loyalty bonus
    if (basicSalary > 100000) pfRate = 0.10; // Lower for high earners
    
    return Math.min(pfRate, 0.15); // Cap at 15%
  }

  private async calculateAttendanceDeduction(employeeId: string, month: number, year: number, grossSalary: number): Promise<number> {
    // Fetch attendance data and apply deduction rules
    // Half day = 50% deduction, Full day = 100% deduction
    const workingDays = 26;
    const perDaySalary = grossSalary / workingDays;
    
    // Mock: fetch actual attendance
    const halfDays = 0;
    const fullDays = 0;
    
    return (halfDays * perDaySalary * 0.5) + (fullDays * perDaySalary);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = parseInt(filters.year);
    return this.payslipRepository.find({ where, relations: ['employee'], order: { year: 'DESC', month: 'DESC' } });
  }

  async findOne(id: string) {
    return this.payslipRepository.findOne({ where: { id }, relations: ['employee'] });
  }

  async updateStatus(id: string, status: string) {
    await this.payslipRepository.update(id, { status });
    return this.findOne(id);
  }
}
