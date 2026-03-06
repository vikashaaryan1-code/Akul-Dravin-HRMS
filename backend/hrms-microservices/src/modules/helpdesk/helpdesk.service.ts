import { Injectable } from '@nestjs/common';

type HelpdeskTicketRecord = {
  id: string;
  ticketNumber: string;
  requester: string;
  department: string;
  category: string;
  priority: string;
  status: string;
  slaHours: number;
  createdAt: string;
};

type HelpdeskSlaRecord = {
  name: string;
  value: number;
};

@Injectable()
export class HelpdeskService {
  private readonly tickets: HelpdeskTicketRecord[] = [
    {
      id: 'HD-1',
      ticketNumber: 'TCK-2026-4101',
      requester: 'Ananya Rao',
      department: 'Engineering',
      category: 'Access Control',
      priority: 'High',
      status: 'Open',
      slaHours: 6,
      createdAt: '2026-03-05T09:20:00.000Z',
    },
    {
      id: 'HD-2',
      ticketNumber: 'TCK-2026-4102',
      requester: 'Raghav Menon',
      department: 'Finance',
      category: 'Payroll Query',
      priority: 'Medium',
      status: 'In Progress',
      slaHours: 12,
      createdAt: '2026-03-05T08:40:00.000Z',
    },
    {
      id: 'HD-3',
      ticketNumber: 'TCK-2026-4103',
      requester: 'Neha Kapoor',
      department: 'HR',
      category: 'Document Request',
      priority: 'Low',
      status: 'Resolved',
      slaHours: 24,
      createdAt: '2026-03-04T17:25:00.000Z',
    },
    {
      id: 'HD-4',
      ticketNumber: 'TCK-2026-4104',
      requester: 'Siddharth Iyer',
      department: 'Operations',
      category: 'System Alert',
      priority: 'Critical',
      status: 'Escalated',
      slaHours: 2,
      createdAt: '2026-03-05T10:10:00.000Z',
    },
  ];

  private readonly slaStatus: HelpdeskSlaRecord[] = [
    { name: 'Within SLA', value: 78 },
    { name: 'Near Breach', value: 14 },
    { name: 'Breached', value: 8 },
  ];

  getTickets(): HelpdeskTicketRecord[] {
    return this.tickets;
  }

  getSlaStatus(): HelpdeskSlaRecord[] {
    return this.slaStatus;
  }
}
