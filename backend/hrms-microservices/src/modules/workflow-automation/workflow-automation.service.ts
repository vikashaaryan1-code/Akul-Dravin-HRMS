import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DocumentCenterService } from '../document-center/document-center.service';
import { CreateWorkflowAutomationDto } from './dto/create-workflow-automation.dto';
import { UpdateWorkflowAutomationDto } from './dto/update-workflow-automation.dto';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';

type WorkflowStatus = 'active' | 'paused' | 'draft';

type WorkflowStage = {
  code: string;
  label: string;
  owner: string;
  slaHours: number;
  output: string;
};

type WorkflowRecord = {
  id: string;
  tenantId: string | null;
  companyId: string | null;
  workflowCode: string;
  name: string;
  module: string;
  triggerType: string;
  status: WorkflowStatus;
  successRate: string;
  runCount: number;
  workflowConfig: Record<string, unknown>;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type InternshipWorkflowDetails = {
  workflowReference: string;
  certificateNumber: string;
  verificationCode: string;
  internName: string;
  candidateEmail: string;
  internshipRole: string;
  department: string;
  university: string;
  mentorName: string;
  startDate: string;
  endDate: string;
  stipend: string;
  projectTitle: string;
  projectSummary: string;
  projectHighlights: string[];
  skillHighlights: string[];
  approverName: string;
  issueDate: string;
  durationWeeks: number;
  dispatchChannels: string[];
};

@Injectable()
export class WorkflowAutomationService {
  private readonly logger = new Logger(WorkflowAutomationService.name);
  private readonly workflows: WorkflowRecord[] = this.createSeedWorkflows();

  constructor(private readonly documentCenterService: DocumentCenterService) {}

  async findAll(): Promise<WorkflowRecord[]> {
    return [...this.workflows]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((workflow) => this.cloneWorkflow(workflow));
  }

  async findOne(id: string): Promise<WorkflowRecord | null> {
    const workflow = this.workflows.find((item) => item.id === id);
    return workflow ? this.cloneWorkflow(workflow) : null;
  }

  async create(dto: CreateWorkflowAutomationDto): Promise<WorkflowRecord> {
    const createdAt = new Date().toISOString();
    const workflow: WorkflowRecord = {
      id: randomUUID(),
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId ?? null,
      workflowCode: dto.workflowCode,
      name: dto.name,
      module: dto.module,
      triggerType: dto.triggerType,
      status: this.toWorkflowStatus(dto.status, 'active'),
      successRate: '98.00',
      runCount: 0,
      workflowConfig: this.cloneValue(dto.workflowConfig ?? {}),
      lastRunAt: null,
      createdAt,
      updatedAt: createdAt,
    };

    this.workflows.unshift(workflow);
    this.logger.log(`Created workflow code=${workflow.workflowCode}`);
    return this.cloneWorkflow(workflow);
  }

  async update(id: string, dto: UpdateWorkflowAutomationDto): Promise<WorkflowRecord> {
    const index = this.workflows.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Workflow not found for id=${id}`);
    }

    const current = this.workflows[index];
    const updated: WorkflowRecord = {
      ...current,
      name: dto.name ?? current.name,
      status: this.toWorkflowStatus(dto.status, current.status),
      successRate: dto.successRate !== undefined ? dto.successRate.toFixed(2) : current.successRate,
      workflowConfig: dto.workflowConfig ? this.cloneValue(dto.workflowConfig) : current.workflowConfig,
      updatedAt: new Date().toISOString(),
    };

    this.workflows[index] = updated;
    this.logger.log(`Updated workflow id=${id} status=${updated.status}`);
    return this.cloneWorkflow(updated);
  }

  async triggerWorkflow(id: string, dto: TriggerWorkflowDto) {
    const index = this.workflows.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Workflow not found for id=${id}`);
    }

    const current = this.workflows[index];
    const updatedRunCount = current.runCount + 1;
    const currentSuccessRate = Number(current.successRate) || 96;
    const smoothedRate = Math.min(99.99, Math.max(90, currentSuccessRate + 0.12));
    const triggeredAt = new Date().toISOString();

    const updated: WorkflowRecord = {
      ...current,
      runCount: updatedRunCount,
      successRate: smoothedRate.toFixed(2),
      lastRunAt: triggeredAt,
      updatedAt: triggeredAt,
    };

    this.workflows[index] = updated;
    this.logger.log(`Triggered workflow id=${id} reason=${dto.triggerReason ?? 'manual-trigger'}`);

    if (updated.workflowCode === 'internship-certificate-automation') {
      const details = this.buildInternshipWorkflowDetails(dto.payload ?? {}, updatedRunCount, triggeredAt);
      const documents = await this.documentCenterService.recordAutomatedDocuments([
        {
          documentType: 'internship-offer-letter',
          documentName: `Internship Offer Letter - ${details.internName}`,
          templateVersion: 'v3',
          status: 'approved',
          payload: {
            workflowCode: updated.workflowCode,
            workflowName: updated.name,
            workflowReference: details.workflowReference,
            internName: details.internName,
            candidateEmail: details.candidateEmail,
            internshipRole: details.internshipRole,
            department: details.department,
            university: details.university,
            mentorName: details.mentorName,
            startDate: details.startDate,
            endDate: details.endDate,
            stipend: details.stipend,
            projectTitle: details.projectTitle,
            approverName: details.approverName,
            issueDate: details.issueDate,
          },
        },
        {
          documentType: 'internship-completion-certificate',
          documentName: `Internship Completion Certificate - ${details.internName}`,
          templateVersion: 'v4',
          status: 'approved',
          payload: {
            workflowCode: updated.workflowCode,
            workflowName: updated.name,
            workflowReference: details.workflowReference,
            certificateNumber: details.certificateNumber,
            verificationCode: details.verificationCode,
            internName: details.internName,
            candidateEmail: details.candidateEmail,
            internshipRole: details.internshipRole,
            department: details.department,
            university: details.university,
            mentorName: details.mentorName,
            startDate: details.startDate,
            endDate: details.endDate,
            stipend: details.stipend,
            projectTitle: details.projectTitle,
            projectSummary: details.projectSummary,
            projectHighlights: details.projectHighlights,
            skillHighlights: details.skillHighlights,
            approverName: details.approverName,
            issueDate: details.issueDate,
          },
        },
        {
          documentType: 'internship-experience-letter',
          documentName: `Internship Experience Letter - ${details.internName}`,
          templateVersion: 'v2',
          status: 'pending-review',
          payload: {
            workflowCode: updated.workflowCode,
            workflowName: updated.name,
            workflowReference: details.workflowReference,
            internName: details.internName,
            internshipRole: details.internshipRole,
            department: details.department,
            mentorName: details.mentorName,
            startDate: details.startDate,
            endDate: details.endDate,
            projectTitle: details.projectTitle,
            projectSummary: details.projectSummary,
            projectHighlights: details.projectHighlights,
            approverName: details.approverName,
            issueDate: details.issueDate,
          },
        },
      ]);

      return {
        workflowId: id,
        workflowCode: updated.workflowCode,
        triggered: true,
        triggerReason: dto.triggerReason ?? 'manual-trigger',
        runCount: updatedRunCount,
        successRate: smoothedRate.toFixed(2),
        payload: dto.payload ?? {},
        triggeredAt,
        documents,
        workflowSummary: {
          workflowReference: details.workflowReference,
          certificateNumber: details.certificateNumber,
          verificationCode: details.verificationCode,
          internName: details.internName,
          candidateEmail: details.candidateEmail,
          internshipRole: details.internshipRole,
          department: details.department,
          university: details.university,
          mentorName: details.mentorName,
          startDate: details.startDate,
          endDate: details.endDate,
          stipend: details.stipend,
          projectTitle: details.projectTitle,
          projectSummary: details.projectSummary,
          projectHighlights: details.projectHighlights,
          skillHighlights: details.skillHighlights,
          approverName: details.approverName,
          issueDate: details.issueDate,
          durationWeeks: details.durationWeeks,
          dispatchChannels: details.dispatchChannels,
          steps: this.extractStages(updated.workflowConfig),
        },
      };
    }

    return {
      workflowId: id,
      workflowCode: updated.workflowCode,
      triggered: true,
      triggerReason: dto.triggerReason ?? 'manual-trigger',
      runCount: updatedRunCount,
      successRate: smoothedRate.toFixed(2),
      payload: dto.payload ?? {},
      triggeredAt,
      documents: [],
      workflowSummary: {
        workflowName: updated.name,
        steps: this.extractStages(updated.workflowConfig),
      },
    };
  }

  async listSystemAlerts() {
    const documents = await this.documentCenterService.findAll();
    const internshipWorkflow = this.workflows.find((item) => item.workflowCode === 'internship-certificate-automation');
    const pendingReview = documents.filter((item) => item.status === 'pending-review').length;
    const recentCertificates = documents.filter(
      (item) =>
        item.documentType.toLowerCase().includes('certificate') &&
        item.generatedAt !== null &&
        new Date(item.generatedAt).getTime() >= Date.now() - (7 * 24 * 60 * 60 * 1000),
    ).length;

    return [
      {
        code: 'AUT-INT-101',
        severity: pendingReview > 0 ? 'medium' : 'low',
        message: pendingReview > 0
          ? `${pendingReview} internship document(s) are waiting for final HR review.`
          : 'All internship packet documents are approved or archived.',
      },
      {
        code: 'AUT-CERT-201',
        severity: 'low',
        message: `${recentCertificates} internship certificate document(s) were generated in the last 7 days.`,
      },
      {
        code: 'AUT-WF-301',
        severity: internshipWorkflow?.lastRunAt ? 'low' : 'high',
        message: internshipWorkflow?.lastRunAt
          ? `Internship certificate workflow last ran on ${this.formatDisplayDate(internshipWorkflow.lastRunAt)}.`
          : 'Internship certificate workflow is configured but has not been triggered yet.',
      },
    ];
  }

  private createSeedWorkflows(): WorkflowRecord[] {
    return [
      this.createSeedWorkflow({
        createdAt: '2026-04-01T09:00:00.000Z',
        workflowCode: 'internship-certificate-automation',
        name: 'Internship Certificate Automation',
        module: 'document-center',
        triggerType: 'manual-or-completion',
        status: 'active',
        successRate: '98.80',
        runCount: 12,
        lastRunAt: '2026-04-12T10:15:00.000Z',
        workflowConfig: {
          packetType: 'internship-certificate',
          dispatchChannels: ['email', 'portal', 'manager-review'],
          steps: [
            { code: 'collect-details', label: 'Collect intern details', owner: 'HR Ops', slaHours: 2, output: 'Validated internship profile' },
            { code: 'generate-packet', label: 'Generate offer and certificate packet', owner: 'Document Center', slaHours: 1, output: 'Offer letter + certificate + experience draft' },
            { code: 'review-approvals', label: 'Run approval chain', owner: 'HR Manager', slaHours: 4, output: 'Approver sign-off and verification metadata' },
            { code: 'dispatch-documents', label: 'Dispatch to intern and mentor', owner: 'Automation Desk', slaHours: 1, output: 'Email, portal, and audit trail updated' },
          ],
        },
      }),
      this.createSeedWorkflow({
        createdAt: '2026-03-15T08:30:00.000Z',
        workflowCode: 'certificate-renewal-reminders',
        name: 'Certificate Reminder Escalations',
        module: 'automation',
        triggerType: 'scheduled',
        status: 'active',
        successRate: '97.40',
        runCount: 26,
        lastRunAt: '2026-04-13T04:30:00.000Z',
        workflowConfig: {
          cadence: 'daily',
          channels: ['email', 'slack'],
        },
      }),
      this.createSeedWorkflow({
        createdAt: '2026-02-20T11:00:00.000Z',
        workflowCode: 'internship-closure-audit',
        name: 'Internship Closure Audit',
        module: 'compliance',
        triggerType: 'event-driven',
        status: 'draft',
        successRate: '94.10',
        runCount: 4,
        lastRunAt: '2026-03-30T16:45:00.000Z',
        workflowConfig: {
          cadence: 'on-completion',
          owner: 'Compliance Desk',
        },
      }),
    ];
  }

  private createSeedWorkflow(input: {
    createdAt: string;
    workflowCode: string;
    name: string;
    module: string;
    triggerType: string;
    status: WorkflowStatus;
    successRate: string;
    runCount: number;
    workflowConfig: Record<string, unknown>;
    lastRunAt: string | null;
  }): WorkflowRecord {
    return {
      id: randomUUID(),
      tenantId: null,
      companyId: null,
      workflowCode: input.workflowCode,
      name: input.name,
      module: input.module,
      triggerType: input.triggerType,
      status: input.status,
      successRate: input.successRate,
      runCount: input.runCount,
      workflowConfig: this.cloneValue(input.workflowConfig),
      lastRunAt: input.lastRunAt,
      createdAt: input.createdAt,
      updatedAt: input.lastRunAt ?? input.createdAt,
    };
  }

  private buildInternshipWorkflowDetails(
    payload: Record<string, unknown>,
    runCount: number,
    triggeredAt: string,
  ): InternshipWorkflowDetails {
    const startDate = this.pickString(payload.startDate, '2026-01-13');
    const endDate = this.pickString(payload.endDate, '2026-04-13');
    const issueDate = this.pickString(payload.issueDate, triggeredAt.slice(0, 10));

    return {
      workflowReference: this.pickString(payload.workflowReference, `WF-INT-${issueDate.replace(/-/g, '')}-${String(runCount).padStart(3, '0')}`),
      certificateNumber: this.pickString(payload.certificateNumber, `AD-CERT-${issueDate.replace(/-/g, '')}-${String(runCount).padStart(3, '0')}`),
      verificationCode: this.pickString(payload.verificationCode, `VERIFY-INT-${String(8400 + runCount).padStart(4, '0')}`),
      internName: this.pickString(payload.internName, 'Aarav Sharma'),
      candidateEmail: this.pickString(payload.candidateEmail, 'aarav.sharma@example.com'),
      internshipRole: this.pickString(payload.internshipRole, 'Frontend Engineering Intern'),
      department: this.pickString(payload.department, 'Product Engineering'),
      university: this.pickString(payload.university, 'IIT Patna'),
      mentorName: this.pickString(payload.mentorName, 'Ruchi Malhotra'),
      startDate,
      endDate,
      stipend: this.pickString(payload.stipend, 'INR 18,000 per month'),
      projectTitle: this.pickString(payload.projectTitle, 'HRMS Workflow Hub'),
      projectSummary: this.pickString(
        payload.projectSummary,
        'Automated internship packet preparation, review routing, and certificate dispatch for the HRMS workspace.',
      ),
      projectHighlights: this.pickStringArray(payload.projectHighlights, [
        'Prepared internship packet with approval metadata',
        'Generated completion certificate with verification code',
        'Drafted experience letter for manager review',
      ]),
      skillHighlights: this.pickStringArray(payload.skillHighlights, [
        'Workflow automation',
        'Documentation quality',
        'Delivery tracking',
      ]),
      approverName: this.pickString(payload.approverName, 'Kavya Bansal'),
      issueDate,
      durationWeeks: this.calculateDurationWeeks(startDate, endDate),
      dispatchChannels: this.pickStringArray(payload.dispatchChannels, ['email', 'portal', 'manager-review']),
    };
  }

  private extractStages(config: Record<string, unknown>): WorkflowStage[] {
    const rawSteps = config.steps;
    if (!Array.isArray(rawSteps)) {
      return [];
    }

    return rawSteps
      .filter((step): step is Record<string, unknown> => typeof step === 'object' && step !== null)
      .map((step, index) => ({
        code: this.pickString(step.code, `step-${index + 1}`),
        label: this.pickString(step.label, `Step ${index + 1}`),
        owner: this.pickString(step.owner, 'Automation Desk'),
        slaHours: typeof step.slaHours === 'number' ? step.slaHours : Number(step.slaHours) || 0,
        output: this.pickString(step.output, 'Workflow output'),
      }));
  }

  private pickString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
  }

  private pickStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
      return [...fallback];
    }

    const filtered = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    return filtered.length > 0 ? filtered : [...fallback];
  }

  private calculateDurationWeeks(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = Math.max(end.getTime() - start.getTime(), 0);
    return Math.max(1, Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)));
  }

  private formatDisplayDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }

  private cloneWorkflow(workflow: WorkflowRecord): WorkflowRecord {
    return {
      ...workflow,
      workflowConfig: this.cloneValue(workflow.workflowConfig),
    };
  }

  private cloneValue<T extends Record<string, unknown>>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private toWorkflowStatus(value: string | undefined, fallback: WorkflowStatus): WorkflowStatus {
    if (value === 'active' || value === 'paused' || value === 'draft') {
      return value;
    }

    return fallback;
  }
}
