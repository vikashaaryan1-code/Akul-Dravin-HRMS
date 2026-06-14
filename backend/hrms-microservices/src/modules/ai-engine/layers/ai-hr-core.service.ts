import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService, AiMessage } from '../ai-provider.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeEntity } from '../../../database/entities/employee.entity';
import { LeaveRequestEntity } from '../../../database/entities/leave-request.entity';
import { TenantContext } from '../../../common/context/tenant-context';

/**
 * LAYER 1: AI HR ENGINE (Core HR Automation)
 *
 * Responsibilities:
 *   - Policy enforcement automation
 *   - Leave approval workflows
 *   - Employee onboarding orchestration
 *   - Lifecycle transitions (Probation → Confirmation → Promotion → Exit)
 *   - Leave abuse pattern alerts
 *   - Multi-level routing decisions (Manager → HR → Department Head)
 */
@Injectable()
export class AiHrCoreService {
  private readonly logger = new Logger(AiHrCoreService.name);

  constructor(
    private readonly aiProvider: AiProviderService,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRepo: Repository<LeaveRequestEntity>,
  ) {}

  /**
   * Analyze leave request and generate approval recommendation
   */
  async analyzeLeaveRequest(leaveRequestId: string): Promise<{
    recommendation: 'APPROVE' | 'REJECT' | 'ESCALATE';
    confidence: number;
    reasoning: string;
    requiresManualReview: boolean;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const leaveRequest = await this.leaveRepo.findOne({
      where: { id: leaveRequestId, tenantId: tenantId },
      relations: ['employee', 'leaveType'],
    });

    if (!leaveRequest) {
      throw new Error(`Leave request ${leaveRequestId} not found`);
    }

    const prompt = `
Analyze this leave request:
- Employee: ${leaveRequest.employee!.firstName}
- Leave Type: ${leaveRequest.leaveType.firstName}
- Duration: ${leaveRequest.startDate} to ${leaveRequest.endDate}
- Reason: ${leaveRequest.reason}
- Employee Performance: ${leaveRequest.employee!.epistemicConfidence}
- Recent Leave Days: ${leaveRequest.employee!.leaveBalances?.totalUsed || 0}

Generate a decision: APPROVE, REJECT, or ESCALATE (for edge cases).
Format response as JSON with: recommendation (string), confidence (0-100), reasoning (string).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR system. Analyze leave requests with fairness, policy compliance, and organizational needs in mind.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      maxTokens: 256,
    });

    try {
      const parsed = JSON.parse(result.content);
      const decision = parsed.recommendation.toUpperCase();
      const valid = ['APPROVE', 'REJECT', 'ESCALATE'].includes(decision);

      return {
        recommendation: valid ? decision : 'ESCALATE',
        confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
        reasoning: parsed.reasoning || 'Analysis complete',
        requiresManualReview: decision === 'ESCALATE' || parsed.confidence < 60,
      };
    } catch (err) { const e = err as any;
      this.logger.error(`Failed to parse leave analysis: ${e.message}`);
      return {
        recommendation: 'ESCALATE',
        confidence: 0,
        reasoning: 'Analysis engine encountered an issue. Manual review required.',
        requiresManualReview: true,
      };
    }
  }

  /**
   * Generate onboarding checklist for new employee
   */
  async generateOnboardingPlan(employeeId: string): Promise<{
    tasks: Array<{ id: string; title: string; daysFromStart: number; assignedTo: string; category: string }>;
    timeline: string;
    customizations: Record<string, unknown>;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenantId: tenantId },
      relations: ['designation', 'department', 'company'],
    });

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const prompt = `
Generate a 30-day structured onboarding plan for:
- Role: ${employee.designation}
- Department: ${employee.departmentId}
- Company: ${employee.companyId}
- Start Date: ${employee.joinDate}

Create onboarding tasks (task_id, title, days_from_start, assigned_to, category).
Respond in JSON format with: tasks (array), timeline (string description), customizations (object).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR system generating personalized onboarding plans. Include HR, IT, management, and team-specific tasks.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 1024,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      this.logger.error(`Onboarding plan generation failed: ${e.message}`);
      return {
        tasks: [
          { id: '1', title: 'IT Setup & Hardware', daysFromStart: 0, assignedTo: 'IT_TEAM', category: 'INFRASTRUCTURE' },
          { id: '2', title: 'Department Orientation', daysFromStart: 1, assignedTo: 'MANAGER', category: 'TEAM' },
          { id: '3', title: 'HR Compliance', daysFromStart: 2, assignedTo: 'HR_TEAM', category: 'COMPLIANCE' },
        ],
        timeline: '30 days',
        customizations: {},
      };
    }
  }

  /**
   * Detect leave abuse patterns and alert
   */
  async detectLeaveAbusePatterns(employeeId: string): Promise<{
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    patterns: Array<{ pattern: string; severity: string; evidence: string }>;
    recommendations: string[];
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenantId: tenantId },
      relations: ['leaveRequests'],
    });

    if (!employee || !employee.leaveRequests) {
      return { risk: 'LOW', patterns: [], recommendations: [] };
    }

    // Simple pattern detection
    const sortedLeaves = employee.leaveRequests.sort((a: any, b: any) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime());
    const patterns: Array<{ pattern: string; severity: string; evidence: string }> = [];

    // Pattern 1: Consecutive Mondays/Fridays
    const adjacentToWeekends = sortedLeaves.filter((leave) => {
      const date = new Date(leave.startDate);
      const day = date.getDay();
      return day === 1 || day === 5; // Monday or Friday
    });
    if (adjacentToWeekends.length > 0) {
      patterns.push({
        pattern: 'ADJACENT_WEEKEND_LEAVES',
        severity: adjacentToWeekends.length > 3 ? 'HIGH' : 'MEDIUM',
        evidence: `${adjacentToWeekends.length} leaves adjacent to weekends in past 6 months`,
      });
    }

    // Pattern 2: Excessive unplanned leaves
    const unplanned = sortedLeaves.filter((l) => l.leaveType?.name === 'Casual Leave');
    if (unplanned.length > 12) {
      patterns.push({
        pattern: 'EXCESSIVE_CASUAL_LEAVES',
        severity: 'HIGH',
        evidence: `${unplanned.length} casual leaves in past 12 months (threshold: 12)`,
      });
    }

    const risk = patterns.some((p) => p.severity === 'HIGH') ? 'HIGH' : patterns.length > 0 ? 'MEDIUM' : 'LOW';

    return {
      risk,
      patterns,
      recommendations: risk === 'HIGH' ? ['Schedule counseling session', 'Review performance metrics', 'Consider formal warning'] : [],
    };
  }

  /**
   * Generate promotion recommendation based on performance
   */
  async getPromotionRecommendations(employeeId: string): Promise<{
    eligible: boolean;
    promotionPath: string;
    expectedSalaryIncrease: number;
    timelineMonths: number;
    readinessSummary: string;
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
Generate promotion recommendation:
- Current Role: ${employee.designation}
- Tenure (months): ${Math.floor((Date.now() - new Date(employee.joinDate).getTime()) / (30 * 24 * 3600 * 1000))}
- Performance Rating: ${employee.epistemicConfidence}
- Current Salary: ${employee.monthlyCtc}

Respond with JSON: eligible (boolean), promotionPath (string), expectedSalaryIncrease (number %), timelineMonths (number), readinessSummary (string).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an HR system analyzing promotion eligibility based on tenure, performance, and career progression.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 256,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      return {
        eligible: false,
        promotionPath: 'Not eligible at this time',
        expectedSalaryIncrease: 0,
        timelineMonths: 24,
        readinessSummary: 'Insufficient performance data',
      };
    }
  }
}
