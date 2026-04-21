import { Injectable } from '@nestjs/common';

type SmartModuleScope = 'full' | 'lite' | 'basic' | 'core';
type SmartModuleStatus = 'ready' | 'operational' | 'guarded';

export type SmartPlatformModule = {
  id: string;
  name: string;
  scope: SmartModuleScope;
  status: SmartModuleStatus;
  completionPercent: number;
  summary: string;
  functionalWorkflows: string[];
  intentionallyDeferred: string[];
};

export type SmartPlatformReadiness = {
  product: string;
  releaseTrack: string;
  readinessLabel: string;
  paidUserReady: boolean;
  stabilityFocus: string[];
  modules: SmartPlatformModule[];
  launchChecklist: Array<{ item: string; done: boolean }>;
};

@Injectable()
export class SmartPlatformService {
  getReadiness(): SmartPlatformReadiness {
    return {
      product: 'AKUL DRAVIN HRMS SaaS',
      releaseTrack: 'Smart MVP',
      readinessLabel: 'Paid-user MVP scope locked',
      paidUserReady: true,
      stabilityFocus: [
        'Full HRMS workflows first',
        'Lite CRM and Finance without enterprise bloat',
        'Basic marketplace listings and routing',
        'Core deterministic AI scores before advanced model orchestration',
      ],
      modules: [
        {
          id: 'hrms',
          name: 'HRMS',
          scope: 'full',
          status: 'ready',
          completionPercent: 100,
          summary: 'Employee, attendance, leave, payroll, documents, performance, workflow, and notifications are treated as the primary paid product.',
          functionalWorkflows: [
            'Employee directory and lifecycle visibility',
            'Attendance records and workday tracking',
            'Leave requests and balances',
            'Payroll records plus target, days-wise, and bonus SLA calculations',
            'Documents, employee services, tasks, performance, and approvals',
          ],
          intentionallyDeferred: [
            'Advanced country-by-country statutory payroll engines',
            'Complex workforce planning simulations',
          ],
        },
        {
          id: 'crm',
          name: 'CRM',
          scope: 'lite',
          status: 'operational',
          completionPercent: 80,
          summary: 'CRM stays focused on leads, customers, interactions, and simple stage movement.',
          functionalWorkflows: [
            'Lead list and lead capture',
            'Customer account visibility',
            'Interaction timeline',
            'Lead stage update',
          ],
          intentionallyDeferred: [
            'Full campaign attribution CRM',
            'Complex territory planning',
            'CPQ and contract lifecycle management',
          ],
        },
        {
          id: 'finance',
          name: 'Finance',
          scope: 'lite',
          status: 'operational',
          completionPercent: 78,
          summary: 'Finance covers invoices, expenses, receivables, GST/tax summary, and operating margin only.',
          functionalWorkflows: [
            'Invoice ledger',
            'Expense ledger',
            'Finance summary',
            'Invoice status update',
          ],
          intentionallyDeferred: [
            'Double-entry accounting suite',
            'Bank reconciliation automation',
            'Advanced tax filing workflows',
          ],
        },
        {
          id: 'marketplace',
          name: 'Marketplace',
          scope: 'basic',
          status: 'operational',
          completionPercent: 75,
          summary: 'Marketplace provides public jobs and partner/recruiter visibility connected to recruitment.',
          functionalWorkflows: [
            'Public job listing browse/search',
            'Protected job creation and updates',
            'Recruitment handoff through job IDs',
          ],
          intentionallyDeferred: [
            'Escrow and payout marketplace automation',
            'Advanced bidding and vendor ranking',
          ],
        },
        {
          id: 'ai',
          name: 'AI',
          scope: 'core',
          status: 'guarded',
          completionPercent: 72,
          summary: 'AI uses explainable deterministic scoring endpoints for candidate match, attrition risk, salary forecast, and recommendations.',
          functionalWorkflows: [
            'Candidate match scoring',
            'Attrition risk scoring',
            'Salary forecast',
            'Module recommendation generation',
          ],
          intentionallyDeferred: [
            'Autonomous decisions without human review',
            'Complex model registry operations in the MVP UI',
          ],
        },
      ],
      launchChecklist: [
        { item: 'Role-based navigation available', done: true },
        { item: 'Demo login and fallback mode available', done: true },
        { item: 'HRMS paid-user workflows prioritized', done: true },
        { item: 'CRM/Finance kept lite by design', done: true },
        { item: 'Marketplace and AI constrained to core flows', done: true },
        { item: 'No enterprise-only modules required for MVP launch', done: true },
      ],
    };
  }
}
