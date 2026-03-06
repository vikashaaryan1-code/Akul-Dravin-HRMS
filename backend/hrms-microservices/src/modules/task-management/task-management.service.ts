import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskManagementService {
  private readonly tasks = [
    {
      id: 'TSK-701',
      taskName: 'Finalize payroll variance report',
      assignee: 'Raghav Menon',
      project: 'Payroll Governance',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2026-03-08',
    },
    {
      id: 'TSK-702',
      taskName: 'Review geofence exception alerts',
      assignee: 'Siddharth Iyer',
      project: 'Location Monitoring',
      priority: 'Medium',
      status: 'Blocked',
      dueDate: '2026-03-09',
    },
    {
      id: 'TSK-703',
      taskName: 'Complete Q1 performance calibration',
      assignee: 'Neha Kapoor',
      project: 'Performance Cycle',
      priority: 'High',
      status: 'In Review',
      dueDate: '2026-03-10',
    },
    {
      id: 'TSK-704',
      taskName: 'Close proposal negotiation: CloudWorks',
      assignee: 'Meera Joshi',
      project: 'Sales Acceleration',
      priority: 'High',
      status: 'Completed',
      dueDate: '2026-03-06',
    },
    {
      id: 'TSK-705',
      taskName: 'Deploy manager permission template',
      assignee: 'Ananya Rao',
      project: 'RBAC Hardening',
      priority: 'Medium',
      status: 'In Progress',
      dueDate: '2026-03-11',
    },
  ];

  private readonly projects = [
    { id: 'PRJ-1', name: 'RBAC Hardening', completion: 76, owner: 'Ananya Rao' },
    { id: 'PRJ-2', name: 'Location Monitoring', completion: 68, owner: 'Siddharth Iyer' },
    { id: 'PRJ-3', name: 'Performance Cycle', completion: 82, owner: 'Neha Kapoor' },
    { id: 'PRJ-4', name: 'Sales Acceleration', completion: 88, owner: 'Meera Joshi' },
  ];

  getTasks() {
    return this.tasks;
  }

  getProjects() {
    return this.projects;
  }
}
