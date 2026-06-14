import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../ai-provider.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeEntity } from '../../../database/entities/employee.entity';
import { DocumentRecordEntity } from '../../../database/entities/document-record.entity';
import { TenantContext } from '../../../common/context/tenant-context';

/**
 * LAYER 8: AI AUTOMATION ENGINE (Document Synthesis)
 *
 * Responsibilities:
 *   - Auto-generate professional offer letters
 *   - Create promotion documentation
 *   - Generate confirmation letters
 *   - Produce relieving letters
 *   - Digital signature integration
 *   - Bulk document generation
 */
@Injectable()
export class AiAutomationEngineService {
  private readonly logger = new Logger(AiAutomationEngineService.name);

  constructor(
    private readonly aiProvider: AiProviderService,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(DocumentRecordEntity)
    private readonly documentRepo: Repository<DocumentRecordEntity>,
  ) {}

  /**
   * Generate professional offer letter for candidate
   */
  async generateOfferLetter(candidateId: string, jobId: string, salary: number, joiningDate: string): Promise<{
    letterContent: string;
    documentId: string;
    requiresSignature: boolean;
  }> {
    const prompt = `
Generate a professional offer letter with:
- Candidate ID: ${candidateId}
- Job ID: ${jobId}
- Salary: ${salary}
- Joining Date: ${joiningDate}

Format as formal business letter with:
- Professional greeting
- Position and salary details
- Benefits summary
- Joining instructions
- Signature block
- Terms and conditions
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR document writer. Generate professional, legally-sound offer letters.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      maxTokens: 1024,
    });

    const tenantId = TenantContext.getRequiredTenantId();
    const document = await this.documentRepo.save({
      tenantId: tenantId,
      documentType: 'OFFER_LETTER',
      content: result.content,
      candidateId,
      status: 'DRAFT',
      createdAt: new Date(),
    });

    return {
      letterContent: result.content,
      documentId: document.id,
      requiresSignature: true,
    };
  }

  /**
   * Generate promotion letter
   */
  async generatePromotionLetter(employeeId: string, newDesignation: string, newSalary: number, effectiveDate: string): Promise<{
    letterContent: string;
    documentId: string;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenantId: tenantId },
      relations: ['designation'],
    });

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const prompt = `
Generate a professional promotion letter:
- Employee: ${employee.firstName}
- Current Role: ${employee.designation}
- New Role: ${newDesignation}
- New Salary: ${newSalary}
- Effective Date: ${effectiveDate}

Include: congratulations, new responsibilities, salary increase, effective date, signature block.
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an HR expert. Generate professional promotion letters that celebrate achievement.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      maxTokens: 512,
    });

    const document = await this.documentRepo.save({
      tenantId: tenantId,
      documentType: 'PROMOTION_LETTER',
      content: result.content,
      employeeId,
      status: 'DRAFT',
      createdAt: new Date(),
    });

    return {
      letterContent: result.content,
      documentId: document.id,
    };
  }

  /**
   * Generate confirmation letter (after probation)
   */
  async generateConfirmationLetter(employeeId: string): Promise<{
    letterContent: string;
    documentId: string;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenantId: tenantId },
      relations: ['designation', 'company'],
    });

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const prompt = `
Generate a professional confirmation letter (end of probation):
- Employee: ${employee.firstName}
- Role: ${employee.designation}
- Company: ${employee.companyId}

Include: confirmation of permanent employment, performance feedback, continued expectations, signature block.
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an HR expert. Generate warm confirmation letters that retain talent.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      maxTokens: 512,
    });

    const document = await this.documentRepo.save({
      tenantId: tenantId,
      documentType: 'CONFIRMATION_LETTER',
      content: result.content,
      employeeId,
      status: 'DRAFT',
      createdAt: new Date(),
    });

    return {
      letterContent: result.content,
      documentId: document.id,
    };
  }

  /**
   * Generate relieving letter (for exit)
   */
  async generateRelievingLetter(employeeId: string, exitDate: string, reasonForExit?: string): Promise<{
    letterContent: string;
    documentId: string;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenantId: tenantId },
      relations: ['designation', 'company'],
    });

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const prompt = `
Generate a professional relieving letter:
- Employee: ${employee.firstName}
- Role: ${employee.designation}
- Last Working Day: ${exitDate}
- Reason: ${reasonForExit || 'Not specified'}

Include: acknowledgment of service, last day of employment, final settlement info, company gratitude, signature block.
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an HR expert. Generate professional relieving letters that maintain good relationships.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 512,
    });

    const document = await this.documentRepo.save({
      tenantId: tenantId,
      documentType: 'RELIEVING_LETTER',
      content: result.content,
      employeeId,
      status: 'DRAFT',
      createdAt: new Date(),
    });

    return {
      letterContent: result.content,
      documentId: document.id,
    };
  }

  /**
   * Generate custom document template
   */
  async generateCustomDocument(template: string, context: Record<string, string>): Promise<{
    content: string;
    documentId: string;
  }> {
    const prompt = `
Generate a professional document using this template:
${template}

Context: ${JSON.stringify(context)}

Fill in all placeholders with provided context. Ensure professional formatting.
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert document generator. Create professional, well-formatted documents.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 1024,
    });

    const tenantId = TenantContext.getRequiredTenantId();
    const document = await this.documentRepo.save({
      tenantId: tenantId,
      documentType: 'CUSTOM',
      content: result.content,
      status: 'DRAFT',
      createdAt: new Date(),
    });

    return {
      content: result.content,
      documentId: document.id,
    };
  }

  /**
   * Mark document as signed (e-signature integration placeholder)
   */
  async signDocument(documentId: string, signatureData: { signedBy: string; signedAt: string; signatureUrl?: string }): Promise<{
    status: 'SIGNED';
    signedAt: string;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const document = await this.documentRepo.findOne({
      where: { id: documentId, tenantId: tenantId },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    await this.documentRepo.update(
      { id: documentId },
      {
        status: 'SIGNED',
        signedAt: new Date(signatureData.signedAt),
        signedBy: signatureData.signedBy,
      },
    );

    return {
      status: 'SIGNED',
      signedAt: signatureData.signedAt,
    };
  }
}
