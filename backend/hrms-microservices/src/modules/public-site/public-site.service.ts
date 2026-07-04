import { Injectable } from '@nestjs/common';
import { CrmService } from '../crm/crm.service';
import { SmartPlatformService } from '../smart-platform/smart-platform.service';
import { CreateA2zWorkflowRequestDto } from './dto/create-a2z-workflow-request.dto';
import { CreatePublicInquiryDto } from './dto/create-public-inquiry.dto';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';

type LandingMetric = {
  label: string;
  value: string;
  detail: string;
};

type LandingServiceCard = {
  id: string;
  category: string;
  title: string;
  description: string;
  href: string;
  highlights: string[];
  modules: string[];
};

type LandingRoleSnapshot = {
  role: string;
  label: string;
  href: string;
  summary: string;
  modules: string[];
};

type LandingJourneyStep = {
  phase: string;
  title: string;
  description: string;
  deliverables: string[];
};

type LandingPlan = {
  name: string;
  price: string;
  commitment: string;
  description: string;
  featured?: boolean;
  cta: string;
  features: string[];
};

type LandingTestimonial = {
  name: string;
  title: string;
  company: string;
  quote: string;
};

type LandingFaqItem = {
  question: string;
  answer: string;
};

type MarketplaceSpotlight = {
  title: string;
  location: string;
  type: string;
  department: string;
};

type InquiryRecord = {
  id: string;
  fullName: string;
  workEmail: string;
  companyName: string;
  phone?: string;
  teamSize?: number;
  interestArea?: string;
  message?: string;
  submittedAt: string;
};

type NewsletterRecord = {
  id: string;
  email: string;
  source: string;
  subscribedAt: string;
};

type A2zWorkflowStep = {
  id: string;
  title: string;
  owner: string;
  sla: string;
  status: 'ready' | 'active' | 'queued';
  description: string;
  outputs: string[];
};

type A2zServiceSuite = {
  id: string;
  title: string;
  description: string;
  valueProposition: string;
  modules: string[];
};

type A2zAssuranceItem = {
  title: string;
  description: string;
};

type A2zRequestRecord = {
  id: string;
  fullName: string;
  workEmail: string;
  companyName: string;
  serviceBundle: string;
  deploymentModel: string;
  priority: string;
  timeline: string;
  phone?: string;
  teamSize?: number;
  regions?: string;
  workflowGoal?: string;
  notes?: string;
  submittedAt: string;
};

export type PublicLandingPayload = {
  generatedAt: string;
  hero: {
    badge: string;
    announcement: string;
    title: string;
    subtitle: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  metrics: LandingMetric[];
  serviceCards: LandingServiceCard[];
  readiness: {
    product: string;
    releaseTrack: string;
    readinessLabel: string;
    paidUserReady: boolean;
    stabilityFocus: string[];
    modules: Array<{
      id: string;
      name: string;
      scope: string;
      status: string;
      completionPercent: number;
      summary: string;
      functionalWorkflows: string[];
      intentionallyDeferred: string[];
    }>;
  };
  roleSnapshots: LandingRoleSnapshot[];
  operatingModel: LandingJourneyStep[];
  plans: LandingPlan[];
  testimonials: LandingTestimonial[];
  faq: LandingFaqItem[];
  marketplaceSpotlight: MarketplaceSpotlight[];
  liveSignals: {
    pipelineLeads: number;
    readinessPercent: number;
    activeModules: number;
    newsletterSubscribers: number;
    recentInquiryAt: string | null;
  };
};

export type PublicA2zPayload = {
  generatedAt: string;
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  serviceSuites: A2zServiceSuite[];
  workflowSteps: A2zWorkflowStep[];
  assurances: A2zAssuranceItem[];
  implementationSignals: {
    activeModules: number;
    readinessPercent: number;
    requestsReceived: number;
    lastRequestAt: string | null;
  };
  formOptions: {
    serviceBundles: string[];
    deploymentModels: string[];
    priorities: string[];
    timelines: string[];
  };
};

const AKUL_DRAVIN_A2Z_HERO: PublicA2zPayload['hero'] = {
  badge: 'AKUL DRAVIN A2Z Atlas',
  title: 'Bring the full AKUL DRAVIN A2Z command catalog into your AKUL DRAVIN rollout workflow.',
  subtitle: 'Platform, people, finance, growth, and learning modules are now grouped the same way as the AKUL DRAVIN dashboard atlas.',
  description:
    'This A2Z experience mirrors the AKUL DRAVIN A2Z Atlas so buyers can plan around the same module map used inside the premium dashboard experience: A2Z Atlas, Admin Command, Employee Matrix, Finance Vault, Recruitment Board, CRM Bridge, Training Grid, and more.',
  primaryCta: { label: 'Start atlas workflow', href: '#a2z-form' },
  secondaryCta: { label: 'See atlas blueprint', href: '#a2z-workflow' },
};

const AKUL_DRAVIN_A2Z_SERVICE_SUITES: A2zServiceSuite[] = [
  {
    id: 'platform-command-atlas',
    title: 'Platform Command Atlas',
    description: 'Search-first control layer for A2Z Atlas, Admin Command, and Intelligence Hub.',
    valueProposition: 'Give leadership a governed index of command rooms, executive signals, and protected operations.',
    modules: ['A2Z Atlas', 'Admin Command', 'Intelligence Hub'],
  },
  {
    id: 'people-operations-mesh',
    title: 'People Operations Mesh',
    description: 'Employee Hub, Employee Matrix, HR Core, Recruitment Board, and Candidates Lab connected into one workforce system.',
    valueProposition: 'Run workforce visibility, hiring flow, HR execution, and employee context from one mapped people stack.',
    modules: ['Employee Hub', 'Employee Matrix', 'HR Core', 'Recruitment Board', 'Candidates Lab'],
  },
  {
    id: 'finance-control-stack',
    title: 'Finance Control Stack',
    description: 'Finance Vault, HR Finance, and Loan Desk grouped for approvals, treasury discipline, and protected finance operations.',
    valueProposition: 'Unify finance visibility, protected approvals, and employee-loan workflows under one executive control surface.',
    modules: ['Finance Vault', 'HR Finance', 'Loan Desk'],
  },
  {
    id: 'growth-revenue-grid',
    title: 'Growth Revenue Grid',
    description: 'Affiliate Grid and CRM Bridge combine channel growth, referrals, and client follow-through.',
    valueProposition: 'Connect growth loops, channel partnerships, and revenue motion to the same A2Z operating model.',
    modules: ['Affiliate Grid', 'CRM Bridge'],
  },
  {
    id: 'learning-launchpad',
    title: 'Learning Launchpad',
    description: 'Exam Lab and Training Grid cover assessments, readiness, and capability delivery.',
    valueProposition: 'Move from assessment to capability rollout without fragmenting training and readiness workflows.',
    modules: ['Exam Lab', 'Training Grid'],
  },
];

const AKUL_DRAVIN_A2Z_WORKFLOW_STEPS: A2zWorkflowStep[] = [
  {
    id: 'atlas-discovery',
    title: 'Atlas Discovery Mapping',
    owner: 'Solution architect',
    sla: 'Within 24 hours',
    status: 'ready',
    description: 'We map your requested modules against the AKUL DRAVIN A2Z catalog so every command lane, team, and dependency is visible early.',
    outputs: ['Atlas module shortlist', 'Department ownership map', 'Priority cluster plan'],
  },
  {
    id: 'command-blueprint',
    title: 'Command Blueprint Design',
    owner: 'Implementation pod',
    sla: 'Within 48 hours',
    status: 'active',
    description: 'A rollout blueprint is created for people, finance, growth, and platform control surfaces with route-by-route implementation logic.',
    outputs: ['Route blueprint', 'Role-based access plan', 'Workflow + automation handoffs'],
  },
  {
    id: 'rollout-handoff',
    title: 'Rollout Handoff + Demo',
    owner: 'Delivery lead',
    sla: 'Within 72 hours',
    status: 'queued',
    description: 'Your team receives a guided walkthrough of the selected AKUL DRAVIN atlas lanes, phased delivery path, and rollout milestones.',
    outputs: ['Executive demo path', 'Milestone sequence', 'Go-live recommendation'],
  },
];

const AKUL_DRAVIN_A2Z_ASSURANCES: A2zAssuranceItem[] = [
  {
    title: 'AKUL DRAVIN-aligned module map',
    description: 'The public A2Z page now reflects the same module grouping and command language used in the AKUL DRAVIN dashboard atlas.',
  },
  {
    title: 'Workflow-based intake',
    description: 'Requests are captured as rollout workflows, not vague contact leads, so the next implementation step is clearer immediately.',
  },
  {
    title: 'Backend-connected signals',
    description: 'A2Z requests remain tracked in backend memory and still create CRM leads for business follow-up.',
  },
];

const AKUL_DRAVIN_A2Z_FORM_OPTIONS: PublicA2zPayload['formOptions'] = {
  serviceBundles: [
    'Complete AKUL DRAVIN A2Z atlas rollout',
    'Platform command + governance stack',
    'People operations mesh',
    'Finance control + approvals stack',
    'Growth revenue grid',
    'Learning + readiness launchpad',
  ],
  deploymentModels: ['Single company launch', 'Multi-branch rollout', 'Multi-country rollout', 'White-label / partner-led rollout'],
  priorities: ['Atlas-wide visibility', 'Workflow automation', 'Executive control', 'Compliance and governance', 'Fast module rollout'],
  timelines: ['Within 2 weeks', 'Within 30 days', 'Within 60 days', 'Quarterly transformation roadmap'],
};

const AKUL_DRAVIN_A2Z_ACTIVE_MODULES = new Set(AKUL_DRAVIN_A2Z_SERVICE_SUITES.flatMap((suite) => suite.modules)).size;

@Injectable()
export class PublicSiteService {
  private readonly inquiries: InquiryRecord[] = [];

  private readonly newsletterSubscribers: NewsletterRecord[] = [];

  private readonly a2zRequests: A2zRequestRecord[] = [];

  constructor(
    private readonly crmService: CrmService,
    private readonly smartPlatformService: SmartPlatformService,
  ) {}

  async getLandingPage(): Promise<PublicLandingPayload> {
    const readiness = this.smartPlatformService.getReadiness();
    const leads = await this.crmService.getLeads();
    const readinessPercent = Math.round(
      readiness.modules.reduce((sum, moduleItem) => sum + moduleItem.completionPercent, 0) /
        Math.max(readiness.modules.length, 1),
    );

    return {
      generatedAt: new Date().toISOString(),
      hero: {
        badge: 'Global HRMS + Business OS',
        announcement:
          'A2Z services, automation, analytics, payroll, CRM, finance, helpdesk, marketplace, and AI in one operating system.',
        title: 'Build your entire workforce and business operations stack on one premium platform.',
        subtitle: 'International-grade design. Full-stack delivery. Ready for demo, growth, and enterprise rollout.',
        description:
          'AKUL DRAVIN combines HRMS, sales, finance, documents, procurement, support, marketplace, and AI automation into one sovereign command center for modern companies.',
        primaryCta: { label: 'Book a live demo', href: '#contact' },
        secondaryCta: { label: 'Explore platform modules', href: '#modules' },
      },
      metrics: [
        { label: 'Unified modules', value: `${readiness.modules.length}+`, detail: 'HRMS, CRM, finance, marketplace, AI, and operations' },
        { label: 'Launch readiness', value: `${readinessPercent}%`, detail: 'Focused smart-MVP scope with paid-user workflows' },
        { label: 'Automation depth', value: '200+', detail: 'Workflow playbooks, approvals, reminders, and document triggers' },
        { label: 'Documents & payroll assets', value: '150+', detail: 'Letters, slips, certificates, and policy-driven templates' },
      ],
      serviceCards: [
        {
          id: 'people-ops',
          category: 'A2Z HRMS',
          title: 'People operations from hiring to exit',
          description:
            'Control attendance, leave, payroll, performance, onboarding, offboarding, and employee self-service from one role-aware workspace.',
          href: '/services',
          highlights: ['Attendance intelligence', 'Payroll automation', 'Performance dashboards', 'Employee service desk'],
          modules: ['Employees', 'Attendance', 'Leave', 'Payroll', 'Performance', 'Documents'],
        },
        {
          id: 'revenue',
          category: 'Sales + CRM',
          title: 'Revenue engine for leads, deals, and customer operations',
          description:
            'Run CRM, deal tracking, commissions, pipeline forecasting, and recruiter/revenue workflows with shared business context.',
          href: '/for-recruiters',
          highlights: ['CRM lead capture', 'Sales pipeline tracking', 'Commission analytics', 'Recruiter marketplace'],
          modules: ['CRM', 'Sales automation', 'Recruitment ATS', 'Recruiter hub'],
        },
        {
          id: 'finance',
          category: 'Finance + Billing',
          title: 'Finance governance without tool sprawl',
          description:
            'Manage invoices, expenses, subscriptions, receivables, payment planning, and plan packaging from a single control surface.',
          href: '/pricing',
          highlights: ['Invoice ledger', 'Expense control', 'Subscription billing', 'Plan catalog'],
          modules: ['Finance', 'Billing', 'Payments', 'Subscriptions'],
        },
        {
          id: 'ops',
          category: 'Operations Cloud',
          title: 'Support, procurement, and admin operations combined',
          description:
            'Operational teams can handle helpdesk tickets, procurement visibility, permissions, analytics, and automation SLAs together.',
          href: '/platform',
          highlights: ['Helpdesk SLA board', 'Procurement summary', 'Permission control', 'Analytics cockpit'],
          modules: ['Helpdesk', 'Procurement', 'Permissions', 'Analytics'],
        },
      ],
      readiness: {
        product: readiness.product,
        releaseTrack: readiness.releaseTrack,
        readinessLabel: readiness.readinessLabel,
        paidUserReady: readiness.paidUserReady,
        stabilityFocus: readiness.stabilityFocus,
        modules: readiness.modules,
      },
      roleSnapshots: [
        {
          role: 'Platform Admin',
          label: 'Govern every tenant, policy, and module launch',
          href: '/dashboard/platform-admin',
          summary: 'Enterprise controls for readiness, security, automation, and cross-module visibility.',
          modules: ['Permissions', 'Analytics', 'Automation', 'Billing'],
        },
        {
          role: 'HR Manager',
          label: 'Own employee lifecycle and compliance outcomes',
          href: '/dashboard/hr-manager',
          summary: 'Daily execution across attendance, documents, payroll readiness, and performance health.',
          modules: ['Employees', 'Attendance', 'Payroll', 'Documents'],
        },
        {
          role: 'Sales Manager',
          label: 'Connect pipeline execution to people and payroll',
          href: '/dashboard/sales-manager',
          summary: 'Track leads, deals, team targets, and commissions without leaving the platform.',
          modules: ['CRM', 'Sales', 'Finance', 'Commissions'],
        },
        {
          role: 'Employee',
          label: 'Self-service workspace for tasks, documents, and growth',
          href: '/dashboard/employee',
          summary: 'Employees get a clean portal for attendance, documents, tasks, notifications, and requests.',
          modules: ['Attendance', 'Tasks', 'Documents', 'Services'],
        },
      ],
      operatingModel: [
        {
          phase: '01',
          title: 'Attract and capture demand',
          description: 'Marketing, recruiters, and sales teams feed demand into one connected lead and talent motion.',
          deliverables: ['Lead capture', 'Recruiter marketplace', 'Job publishing', 'Candidate qualification'],
        },
        {
          phase: '02',
          title: 'Convert into teams and workflows',
          description: 'Approved hires, departments, permissions, and onboarding journeys are provisioned with policy guardrails.',
          deliverables: ['Onboarding flows', 'Role-based access', 'Document kits', 'Task allocation'],
        },
        {
          phase: '03',
          title: 'Operate daily with intelligence',
          description: 'Teams execute attendance, tasks, payroll, services, approvals, and support using automation-first controls.',
          deliverables: ['Attendance automation', 'Payroll cycles', 'Helpdesk queues', 'Workflow orchestration'],
        },
        {
          phase: '04',
          title: 'Measure, optimize, and scale',
          description: 'Managers and admins use analytics, finance views, and AI recommendations to improve margins and throughput.',
          deliverables: ['Performance scoring', 'Finance summary', 'Sales analytics', 'AI recommendations'],
        },
      ],
      plans: [
        {
          name: 'Free',
          price: '₹0',
          commitment: '1–5 Employees (Trial)',
          description: 'Get started with basic employee records and attendance tracking.',
          cta: 'Start Free Trial',
          features: ['Employee Records', 'Manual Attendance', 'Leave Management', 'ESS', 'Basic Reports', 'Email Support'],
        },
        {
          name: 'HR Lite',
          price: '₹999/mo',
          commitment: '6–25 Employees (Small Office)',
          description: 'Ideal for small offices needing payroll and mobile access.',
          cta: 'Upgrade to Lite',
          features: ['Payroll', 'Mobile App', 'Biometric'],
        },
        {
          name: 'HR Pro',
          price: '₹2,499/mo',
          commitment: '26–50 Employees (SMEs)',
          description: 'Streamline hiring, timesheets, and internal support.',
          featured: true,
          cta: 'Get HR Pro',
          features: ['Recruitment', 'Timesheets', 'Helpdesk'],
        },
        {
          name: 'HR + Payroll',
          price: '₹4,999/mo',
          commitment: '51–100 Employees (Growing Companies)',
          description: 'Advanced features with compliance and custom workflows.',
          cta: 'Scale with HR + Payroll',
          features: ['Compliance', 'Custom Workflows', 'Advanced Analytics'],
        },
        {
          name: 'Business HRMS',
          price: '₹9,999/mo',
          commitment: '101–250 Employees (Medium Business)',
          description: 'Manage assets, performance, and multiple branches effortlessly.',
          cta: 'Upgrade to Business',
          features: ['Asset Management', 'Performance', 'Multi-Branch'],
        },
        {
          name: 'Premium HRMS',
          price: '₹17,999/mo',
          commitment: '251–500 Employees (Large Business)',
          description: 'Unlock AI capabilities and dedicated account management.',
          cta: 'Go Premium',
          features: ['AI Assistant', 'Dedicated Account Manager', 'API Access'],
        },
        {
          name: 'Enterprise',
          price: 'Custom',
          commitment: '500+ Employees (Corporate & Enterprise)',
          description: 'Tailored solutions, custom development, and strict SLAs.',
          cta: 'Contact Sales',
          features: ['Custom Development', 'On-Premise Option', 'SLA'],
        },
      ],
      testimonials: [
        {
          name: 'Rhea Malhotra',
          title: 'Director of People Operations',
          company: 'NexaCom Global',
          quote:
            'We replaced disconnected HR, payroll, ticketing, and reporting tools with one command center and cut manual work drastically.',
        },
        {
          name: 'Kabir Shah',
          title: 'VP Revenue Systems',
          company: 'NorthGrid Energy',
          quote:
            'The value came from combining CRM, people operations, and finance visibility instead of stitching together separate SaaS products.',
        },
        {
          name: 'Sanjana Iyer',
          title: 'COO',
          company: 'Orion Workforce Labs',
          quote:
            'The platform feels enterprise-ready on the front end while still practical for our daily teams on the backend.',
        },
      ],
      faq: [
        {
          question: 'Is this only an HRMS product?',
          answer:
            'No. HRMS is the primary pillar, but the platform also covers CRM, sales, finance, helpdesk, procurement, marketplace, subscriptions, and AI-assisted workflows.',
        },
        {
          question: 'Can we start with one module and expand later?',
          answer:
            'Yes. Teams can begin with core HRMS or business operations and progressively enable more modules without replacing the platform foundation.',
        },
        {
          question: 'Do managers and employees see different dashboards?',
          answer:
            'Yes. Role-based workspaces are already part of the product direction so each stakeholder sees focused metrics, actions, and approvals.',
        },
      ],
      marketplaceSpotlight: [
        { title: 'Senior HR Operations Manager', location: 'Dubai, UAE', type: 'Full-time', department: 'People & Compliance' },
        { title: 'Enterprise Payroll Lead', location: 'London, UK', type: 'Hybrid', department: 'Finance Operations' },
        { title: 'Revenue Ops Analyst', location: 'Bengaluru, India', type: 'Full-time', department: 'Sales Intelligence' },
      ],
      liveSignals: {
        pipelineLeads: leads.length,
        readinessPercent,
        activeModules: readiness.modules.length,
        newsletterSubscribers: this.newsletterSubscribers.length,
        recentInquiryAt: this.inquiries[0]?.submittedAt ?? null,
      },
    };
  }

  getA2zPage(): PublicA2zPayload {
    const readiness = this.smartPlatformService.getReadiness();
    const readinessPercent = Math.round(
      readiness.modules.reduce((sum, moduleItem) => sum + moduleItem.completionPercent, 0) /
        Math.max(readiness.modules.length, 1),
    );

    return {
      generatedAt: new Date().toISOString(),
      hero: AKUL_DRAVIN_A2Z_HERO,
      serviceSuites: AKUL_DRAVIN_A2Z_SERVICE_SUITES,
      workflowSteps: AKUL_DRAVIN_A2Z_WORKFLOW_STEPS,
      assurances: AKUL_DRAVIN_A2Z_ASSURANCES,
      implementationSignals: {
        activeModules: AKUL_DRAVIN_A2Z_ACTIVE_MODULES,
        readinessPercent,
        requestsReceived: this.a2zRequests.length,
        lastRequestAt: this.a2zRequests[0]?.submittedAt ?? null,
      },
      formOptions: AKUL_DRAVIN_A2Z_FORM_OPTIONS,
    };
  }

  createInquiry(payload: CreatePublicInquiryDto) {
    const submittedAt = new Date().toISOString();
    const inquiry: InquiryRecord = {
      id: `PUB-INQ-${Date.now()}`,
      fullName: payload.fullName,
      workEmail: payload.workEmail,
      companyName: payload.companyName,
      phone: payload.phone,
      teamSize: payload.teamSize,
      interestArea: payload.interestArea,
      message: payload.message,
      submittedAt,
    };

    this.inquiries.unshift(inquiry);

    const lead = this.crmService.createLead({
      leadName: payload.fullName,
      organization: payload.companyName,
      stage: 'Discovery Requested',
      ownerName: 'Public Website Queue',
      score: payload.teamSize && payload.teamSize >= 500 ? 95 : 82,
    });

    return {
      status: 'accepted',
      referenceId: inquiry.id,
      nextStep: 'Our product team will review your request and schedule a walkthrough.',
      submittedAt,
      lead,
    };
  }

  createA2zWorkflowRequest(payload: CreateA2zWorkflowRequestDto) {
    const submittedAt = new Date().toISOString();
    const request: A2zRequestRecord = {
      id: `A2Z-REQ-${Date.now()}`,
      fullName: payload.fullName,
      workEmail: payload.workEmail,
      companyName: payload.companyName,
      serviceBundle: payload.serviceBundle,
      deploymentModel: payload.deploymentModel,
      priority: payload.priority,
      timeline: payload.timeline,
      phone: payload.phone,
      teamSize: payload.teamSize,
      regions: payload.regions,
      workflowGoal: payload.workflowGoal,
      notes: payload.notes,
      submittedAt,
    };

    this.a2zRequests.unshift(request);

    const lead = this.crmService.createLead({
      leadName: payload.fullName,
      organization: payload.companyName,
      stage: 'A2Z Workflow Requested',
      ownerName: 'A2Z Solution Desk',
      score: payload.teamSize && payload.teamSize >= 250 ? 96 : 88,
    });

    return {
      status: 'accepted',
      referenceId: request.id,
      submittedAt,
      nextStep: 'Your A2Z request has been captured. Discovery review has been queued for the solution team.',
      lead,
      workflowPlan: [
        {
          phase: 'Request captured',
          status: 'completed',
          owner: 'Public website gateway',
          eta: 'Now',
        },
        {
          phase: 'Discovery review',
          status: 'queued',
          owner: 'Solution architect',
          eta: 'Within 24 hours',
        },
        {
          phase: 'Workflow blueprint',
          status: 'queued',
          owner: 'Implementation pod',
          eta: 'Within 48 hours',
        },
        {
          phase: 'Demo and rollout proposal',
          status: 'queued',
          owner: 'Delivery lead',
          eta: 'Within 72 hours',
        },
      ],
      requestSnapshot: {
        serviceBundle: request.serviceBundle,
        deploymentModel: request.deploymentModel,
        priority: request.priority,
        timeline: request.timeline,
      },
    };
  }

  subscribeNewsletter(payload: SubscribeNewsletterDto) {
    const subscribedAt = new Date().toISOString();
    const existing = this.newsletterSubscribers.find((item) => item.email.toLowerCase() === payload.email.toLowerCase());

    if (!existing) {
      this.newsletterSubscribers.unshift({
        id: `PUB-NEWS-${Date.now()}`,
        email: payload.email,
        source: payload.source ?? 'landing-page',
        subscribedAt,
      });
    }

    return {
      status: 'subscribed',
      email: payload.email,
      subscribedAt,
      totalSubscribers: this.newsletterSubscribers.length,
    };
  }
}
