import { Injectable } from '@nestjs/common';

@Injectable()
export class PingPlanService {
  async createPing(data: {
    employeeId: string;
    pingType: string;
    latitude?: number;
    longitude?: number;
    location?: string;
    notes?: string;
    status?: string;
    deviceInfo?: string;
  }) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      pingTime: new Date(),
      createdAt: new Date(),
    };
  }

  async getEmployeePings(employeeId: string, date?: string) {
    return [];
  }

  async getEmployeeStatus(employeeId: string) {
    return {
      employeeId,
      currentStatus: 'working',
      lastPingTime: new Date(),
      todayPings: 0,
    };
  }

  async getDailyReport(companyId: string, date: string) {
    return {
      date,
      totalEmployees: 0,
      checkedIn: 0,
      onBreak: 0,
      checkedOut: 0,
    };
  }
}
