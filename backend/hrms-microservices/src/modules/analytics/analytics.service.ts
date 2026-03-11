import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../database/entities/employee.entity';
import { Attendance } from '../../database/entities/attendance.entity';
import { LeaveRequest } from '../../database/entities/leave-request.entity';
import { Job } from '../../database/entities/job.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Employee) private employeeRepository: Repository<Employee>,
    @InjectRepository(Attendance) private attendanceRepository: Repository<Attendance>,
    @InjectRepository(LeaveRequest) private leaveRepository: Repository<LeaveRequest>,
    @InjectRepository(Job) private jobRepository: Repository<Job>,
  ) {}

  async getDashboardStats() {
    const totalEmployees = await this.employeeRepository.count();
    const activeEmployees = await this.employeeRepository.count({ where: { status: 'active' } });
    const totalJobs = await this.jobRepository.count();
    const openJobs = await this.jobRepository.count({ where: { status: 'open' } });
    const pendingLeaves = await this.leaveRepository.count({ where: { status: 'pending' } });
    
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await this.attendanceRepository.count({ where: { date: new Date(today) } });

    return {
      employees: { total: totalEmployees, active: activeEmployees },
      jobs: { total: totalJobs, open: openJobs },
      leaves: { pending: pendingLeaves },
      attendance: { today: todayAttendance },
    };
  }

  async getEmployeeGrowth() {
    const employees = await this.employeeRepository.find({ order: { createdAt: 'ASC' } });
    const monthlyData: any = {};
    
    employees.forEach(emp => {
      const month = new Date(emp.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  }

  async getAttendanceTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const records = await this.attendanceRepository.find({
      where: { date: startDate as any },
      order: { date: 'ASC' },
    });

    const dailyData: any = {};
    records.forEach(rec => {
      const date = new Date(rec.date).toLocaleDateString();
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    return Object.entries(dailyData).map(([date, count]) => ({ date, count }));
  }
}
