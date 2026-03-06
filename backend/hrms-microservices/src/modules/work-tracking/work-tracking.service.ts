import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkTrackingService {
  private readonly activities = [
    {
      id: 'ACT-101',
      employeeName: 'Ananya Rao',
      loginAt: '09:05',
      logoutAt: '18:22',
      tasksCompleted: 9,
      productiveHours: 8.4,
      project: 'Workforce Command UI',
    },
    {
      id: 'ACT-102',
      employeeName: 'Meera Joshi',
      loginAt: '08:57',
      logoutAt: '18:08',
      tasksCompleted: 7,
      productiveHours: 7.9,
      project: 'Sales CRM Automation',
    },
    {
      id: 'ACT-103',
      employeeName: 'Raghav Menon',
      loginAt: '09:18',
      logoutAt: '17:54',
      tasksCompleted: 6,
      productiveHours: 7.2,
      project: 'Payroll Compliance Engine',
    },
    {
      id: 'ACT-104',
      employeeName: 'Neha Kapoor',
      loginAt: '09:12',
      logoutAt: '18:10',
      tasksCompleted: 8,
      productiveHours: 7.8,
      project: 'Talent Operations Sprint',
    },
    {
      id: 'ACT-105',
      employeeName: 'Siddharth Iyer',
      loginAt: '09:00',
      logoutAt: '19:02',
      tasksCompleted: 10,
      productiveHours: 8.9,
      project: 'Automation Reliability Program',
    },
  ];

  private readonly workdays = [
    { id: 'WD-1', employeeName: 'Ananya Rao', presentDays: 21, absentDays: 1, paidLeave: 1, unpaidLeave: 0, wfhDays: 6 },
    { id: 'WD-2', employeeName: 'Meera Joshi', presentDays: 20, absentDays: 0, paidLeave: 2, unpaidLeave: 0, wfhDays: 8 },
    { id: 'WD-3', employeeName: 'Raghav Menon', presentDays: 19, absentDays: 1, paidLeave: 1, unpaidLeave: 1, wfhDays: 4 },
    { id: 'WD-4', employeeName: 'Neha Kapoor', presentDays: 18, absentDays: 2, paidLeave: 2, unpaidLeave: 0, wfhDays: 7 },
  ];

  getActivities() {
    return this.activities;
  }

  getWorkdays() {
    return this.workdays;
  }
}
