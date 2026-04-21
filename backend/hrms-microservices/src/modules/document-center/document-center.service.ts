import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';

type DocumentStatus = 'generated' | 'pending-review' | 'approved' | 'rejected' | 'archived';

export type DocumentCenterRecord = {
  id: string;
  tenantId: string | null;
  companyId: string | null;
  employeeId: string | null;
  documentType: string;
  documentName: string;
  templateVersion: string;
  status: DocumentStatus;
  fileUrl: string;
  documentPayload: Record<string, unknown>;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateDocumentRecordInput = {
  tenantId?: string | null;
  companyId?: string | null;
  employeeId?: string | null;
  documentType: string;
  documentName: string;
  templateVersion?: string;
  status?: DocumentStatus;
  fileUrl?: string;
  payload?: Record<string, unknown>;
  generatedAt?: string | null;
  createdAt?: string;
};

@Injectable()
export class DocumentCenterService {
  private readonly logger = new Logger(DocumentCenterService.name);
  private readonly documents: DocumentCenterRecord[] = this.createSeedDocuments();

  async findAll(): Promise<DocumentCenterRecord[]> {
    return [...this.documents]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((record) => this.cloneRecord(record));
  }

  async findOne(id: string): Promise<DocumentCenterRecord | null> {
    const record = this.documents.find((item) => item.id === id);
    return record ? this.cloneRecord(record) : null;
  }

  async generateDocument(dto: GenerateDocumentDto): Promise<DocumentCenterRecord> {
    const record = this.recordDocument({
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId ?? null,
      employeeId: dto.employeeId ?? null,
      documentType: dto.documentType,
      documentName: dto.documentName,
      templateVersion: dto.templateVersion ?? 'v1',
      payload: dto.payload ?? {},
    });

    this.logger.log(`Generated document type=${dto.documentType} name=${dto.documentName}`);
    return record;
  }

  async generateCertificate(dto: GenerateDocumentDto): Promise<DocumentCenterRecord> {
    const certificateDto: GenerateDocumentDto = {
      ...dto,
      documentType: 'certificate',
    };

    const result = await this.generateDocument(certificateDto);
    this.logger.log(`Certificate generated id=${result.id}`);
    return result;
  }

  async recordAutomatedDocuments(inputs: CreateDocumentRecordInput[]): Promise<DocumentCenterRecord[]> {
    return inputs.map((input) => this.recordDocument(input));
  }

  async updateStatus(id: string, dto: UpdateDocumentStatusDto): Promise<DocumentCenterRecord> {
    const index = this.documents.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Document not found for id=${id}`);
    }

    const current = this.documents[index];
    const updated: DocumentCenterRecord = {
      ...current,
      status: this.toDocumentStatus(dto.status, current.status),
      fileUrl: dto.fileUrl ?? current.fileUrl,
      generatedAt: current.generatedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.documents[index] = updated;
    this.logger.log(`Updated document status id=${id} status=${updated.status}`);
    return this.cloneRecord(updated);
  }

  private recordDocument(input: CreateDocumentRecordInput): DocumentCenterRecord {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const generatedAt = input.generatedAt ?? createdAt;
    const record: DocumentCenterRecord = {
      id: randomUUID(),
      tenantId: input.tenantId ?? null,
      companyId: input.companyId ?? null,
      employeeId: input.employeeId ?? null,
      documentType: input.documentType,
      documentName: input.documentName,
      templateVersion: input.templateVersion ?? 'v1',
      status: input.status ?? 'generated',
      fileUrl: input.fileUrl ?? this.buildFileUrl(input.documentType, input.documentName),
      documentPayload: this.clonePayload(input.payload ?? {}),
      generatedAt,
      createdAt,
      updatedAt: createdAt,
    };

    this.documents.unshift(record);
    return this.cloneRecord(record);
  }

  private createSeedDocuments(): DocumentCenterRecord[] {
    return [
      this.createSeedRecord({
        createdAt: '2026-04-12T10:15:00.000Z',
        documentType: 'internship-completion-certificate',
        documentName: 'Internship Completion Certificate - Riya Mehta',
        templateVersion: 'v4',
        status: 'approved',
        payload: {
          workflowCode: 'internship-certificate-automation',
          workflowReference: 'WF-INT-260412-101',
          certificateNumber: 'AD-CERT-20260412-101',
          verificationCode: 'VERIFY-INT-8841',
          internName: 'Riya Mehta',
          candidateEmail: 'riya.mehta@example.com',
          internshipRole: 'Product Operations Intern',
          department: 'People Operations',
          university: 'Nirma University',
          mentorName: 'Ankita Sharma',
          startDate: '2026-01-06',
          endDate: '2026-04-11',
          stipend: 'INR 18,000 per month',
          projectTitle: 'Internship Workflow Automation',
          projectSummary: 'Built the approval and certificate dispatch flow for internship programs.',
          projectHighlights: ['Created approval packet routing', 'Reduced manual certificate prep time', 'Published audit-ready certificate metadata'],
          skillHighlights: ['Workflow design', 'Documentation', 'Operations analytics'],
          approverName: 'Neha Kapoor',
          issueDate: '2026-04-12',
        },
      }),
      this.createSeedRecord({
        createdAt: '2026-04-12T10:10:00.000Z',
        documentType: 'internship-experience-letter',
        documentName: 'Internship Experience Letter - Riya Mehta',
        templateVersion: 'v2',
        status: 'approved',
        payload: {
          workflowCode: 'internship-certificate-automation',
          workflowReference: 'WF-INT-260412-101',
          internName: 'Riya Mehta',
          internshipRole: 'Product Operations Intern',
          department: 'People Operations',
          mentorName: 'Ankita Sharma',
          startDate: '2026-01-06',
          endDate: '2026-04-11',
          approverName: 'Neha Kapoor',
          issueDate: '2026-04-12',
        },
      }),
      this.createSeedRecord({
        createdAt: '2026-03-28T08:45:00.000Z',
        documentType: 'internship-offer-letter',
        documentName: 'Internship Offer Letter - Manav Sethi',
        templateVersion: 'v3',
        status: 'generated',
        payload: {
          workflowCode: 'internship-certificate-automation',
          workflowReference: 'WF-INT-260328-087',
          internName: 'Manav Sethi',
          candidateEmail: 'manav.sethi@example.com',
          internshipRole: 'Frontend Engineering Intern',
          department: 'Product Engineering',
          university: 'IIIT Delhi',
          mentorName: 'Ruchi Malhotra',
          startDate: '2026-04-15',
          endDate: '2026-07-15',
          stipend: 'INR 22,000 per month',
          projectTitle: 'HRMS Workspace Refresh',
          approverName: 'Karan Bhatia',
          issueDate: '2026-03-28',
        },
      }),
    ];
  }

  private createSeedRecord(input: CreateDocumentRecordInput): DocumentCenterRecord {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const generatedAt = input.generatedAt ?? createdAt;

    return {
      id: randomUUID(),
      tenantId: input.tenantId ?? null,
      companyId: input.companyId ?? null,
      employeeId: input.employeeId ?? null,
      documentType: input.documentType,
      documentName: input.documentName,
      templateVersion: input.templateVersion ?? 'v1',
      status: input.status ?? 'generated',
      fileUrl: input.fileUrl ?? this.buildFileUrl(input.documentType, input.documentName),
      documentPayload: this.clonePayload(input.payload ?? {}),
      generatedAt,
      createdAt,
      updatedAt: createdAt,
    };
  }

  private buildFileUrl(type: string, name: string): string {
    const safeName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `/generated-documents/${type}/${safeName}-${Date.now()}.pdf`;
  }

  private cloneRecord(record: DocumentCenterRecord): DocumentCenterRecord {
    return {
      ...record,
      documentPayload: this.clonePayload(record.documentPayload),
    };
  }

  private clonePayload(payload: Record<string, unknown>): Record<string, unknown> {
    return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  }

  private toDocumentStatus(value: string | undefined, fallback: DocumentStatus): DocumentStatus {
    if (value === 'generated' || value === 'pending-review' || value === 'approved' || value === 'rejected' || value === 'archived') {
      return value;
    }

    return fallback;
  }
}
