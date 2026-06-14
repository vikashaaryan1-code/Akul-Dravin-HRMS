import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService, AiMessage } from '../ai-provider.service';

/**
 * LAYER 7: AI VOICE & TEXT ASSISTANT (Conversational Q&A)
 *
 * Responsibilities:
 *   - Self-service payroll breakdown queries
 *   - Leave balance calculations
 *   - HR policy Q&A
 *   - Employee onboarding guidance
 *   - Benefits explanation
 */
@Injectable()
export class AiVoiceTextAssistantService {
  private readonly logger = new Logger(AiVoiceTextAssistantService.name);

  constructor(private readonly aiProvider: AiProviderService) {}

  /**
   * Handle conversational Q&A for employees
   */
  async handleEmployeeQuery(query: string, context?: { employeeId?: string; department?: string; role?: string }): Promise<{
    response: string;
    isAnswered: boolean;
    confidence: number;
    escalationNeeded: boolean;
    escalationReason?: string;
  }> {
    const systemPrompt = `
You are an intelligent HR Assistant for the Akul Dravin HRMS platform.
Help employees with:
- Payroll inquiries (salary breakdown, deductions, tax info)
- Leave balance and policy questions
- HR policies and procedures
- Benefits explanation
- Onboarding guidance
- Attendance and shift queries

Be concise, accurate, and professional. If uncertain, recommend escalation to HR.
${context?.role ? `Employee Role: ${context.role}` : ''}
`;

    const result = await this.aiProvider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.6,
      maxTokens: 256,
    });

    const confidence = 0.8; // Default confidence
    const requiresEscalation = result.content.toLowerCase().includes('recommend escalation') || confidence < 0.7;

    return {
      response: result.content,
      isAnswered: !requiresEscalation,
      confidence,
      escalationNeeded: requiresEscalation,
      escalationReason: requiresEscalation ? 'Complex query requires HR review' : undefined,
    };
  }

  /**
   * Explain payroll breakdown to employee
   */
  async explainPayslip(
    monthlyCtc: number,
    deductions: Record<string, number>,
    allowances: Record<string, number>,
  ): Promise<string> {
    const breakdown = `
Base Salary: ${monthlyCtc}
Allowances: ${Object.entries(allowances).map(([k, v]) => `${k}: ${v}`).join(', ')}
Deductions: ${Object.entries(deductions).map(([k, v]) => `${k}: ${v}`).join(', ')}
Net Salary: ${monthlyCtc + Object.values(allowances).reduce((a: any, b: any) => a + b, 0) - Object.values(deductions).reduce((a: any, b: any) => a + b, 0)}
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a payroll expert. Explain salary breakdowns in simple, clear language.',
        },
        {
          role: 'user',
          content: `Explain this payslip breakdown to an employee:\n${breakdown}\n\nBe clear about each component and tax implications.`,
        },
      ],
      temperature: 0.5,
      maxTokens: 256,
    });

    return result.content;
  }

  /**
   * Answer leave policy questions
   */
  async answerLeavePolicy(question: string): Promise<string> {
    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an HR compliance expert. Answer questions about leave policies clearly and accurately.',
        },
        { role: 'user', content: `Leave policy question: ${question}\n\nProvide a clear, concise answer.` },
      ],
      temperature: 0.5,
      maxTokens: 256,
    });

    return result.content;
  }

  /**
   * Generate personalized onboarding guidance
   */
  async generateOnboardingGuidance(role: string, department: string, startDate: string): Promise<string> {
    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an onboarding coach. Provide personalized, encouraging guidance for new employees.',
        },
        {
          role: 'user',
          content: `Generate onboarding guidance for:\nRole: ${role}\nDepartment: ${department}\nStart Date: ${startDate}\n\nInclude what to expect, key contacts, and success tips.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 512,
    });

    return result.content;
  }
}
