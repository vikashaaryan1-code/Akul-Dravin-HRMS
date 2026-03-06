import { Injectable } from '@nestjs/common';

type CrmLeadRecord = {
  id: string;
  leadName: string;
  organization: string;
  stage: string;
  ownerName: string;
  score: number;
  lastTouch: string;
};

type CrmCustomerRecord = {
  id: string;
  accountName: string;
  industry: string;
  ownerName: string;
  healthStatus: string;
  annualValue: number;
};

type CrmInteractionRecord = {
  id: string;
  customerName: string;
  channel: string;
  interactionType: string;
  happenedAt: string;
  summary: string;
};

@Injectable()
export class CrmService {
  private readonly leads: CrmLeadRecord[] = [
    {
      id: 'CRM-LEAD-1',
      leadName: 'Ishita Khanna',
      organization: 'Vertex Retail Group',
      stage: 'Qualified',
      ownerName: 'Meera Joshi',
      score: 91,
      lastTouch: '2026-03-05T11:20:00.000Z',
    },
    {
      id: 'CRM-LEAD-2',
      leadName: 'Arjun Sethi',
      organization: 'BlueOrbit Logistics',
      stage: 'Proposal Sent',
      ownerName: 'Ananya Rao',
      score: 86,
      lastTouch: '2026-03-05T10:42:00.000Z',
    },
    {
      id: 'CRM-LEAD-3',
      leadName: 'Nidhi Goel',
      organization: 'Astra Medtech',
      stage: 'Negotiation',
      ownerName: 'Siddharth Iyer',
      score: 94,
      lastTouch: '2026-03-04T18:02:00.000Z',
    },
  ];

  private readonly customers: CrmCustomerRecord[] = [
    {
      id: 'CRM-CUST-1',
      accountName: 'CloudWorks Asia',
      industry: 'Technology',
      ownerName: 'Meera Joshi',
      healthStatus: 'Healthy',
      annualValue: 520000,
    },
    {
      id: 'CRM-CUST-2',
      accountName: 'NorthGrid Energy',
      industry: 'Energy',
      ownerName: 'Siddharth Iyer',
      healthStatus: 'Healthy',
      annualValue: 470000,
    },
    {
      id: 'CRM-CUST-3',
      accountName: 'Prime Habitat',
      industry: 'Real Estate',
      ownerName: 'Neha Kapoor',
      healthStatus: 'At Risk',
      annualValue: 125000,
    },
  ];

  private readonly interactions: CrmInteractionRecord[] = [
    {
      id: 'CRM-INT-1',
      customerName: 'CloudWorks Asia',
      channel: 'Email',
      interactionType: 'Proposal Discussion',
      happenedAt: '2026-03-05T08:40:00.000Z',
      summary: 'Security and integration checklist reviewed.',
    },
    {
      id: 'CRM-INT-2',
      customerName: 'NorthGrid Energy',
      channel: 'Call',
      interactionType: 'Pricing Review',
      happenedAt: '2026-03-05T07:55:00.000Z',
      summary: 'Annual pricing revised with volume commitment.',
    },
    {
      id: 'CRM-INT-3',
      customerName: 'Prime Habitat',
      channel: 'Meeting',
      interactionType: 'Escalation',
      happenedAt: '2026-03-04T17:10:00.000Z',
      summary: 'Deployment delay mitigation plan shared.',
    },
  ];

  getLeads(): CrmLeadRecord[] {
    return this.leads;
  }

  getCustomers(): CrmCustomerRecord[] {
    return this.customers;
  }

  getInteractions(): CrmInteractionRecord[] {
    return this.interactions;
  }
}
