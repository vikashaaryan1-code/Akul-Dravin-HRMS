import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../ai-provider.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeEntity } from '../../../database/entities/employee.entity';
import { TenantContext } from '../../../common/context/tenant-context';

/**
 * LAYER 5: AI DECISION ENGINE (Strategic Support)
 *
 * Responsibilities:
 *   - Auto-generate promotion paths
 *   - Training plan recommendations
 *   - Talent redistribution matrices
 *   - Compensation optimization
 */
@Injectable()
export class AiDecisionEngineService {
  private readonly logger = new Logger(AiDecisionEngineService.name);

  constructor(
    private readonly aiProvider: AiProviderService,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  /**
   * Generate personalized training plan for employee development
   */
  async generateTrainingPlan(employeeId: string, targetRole?: string): Promise<{
    currentLevel: string;
    targetLevel: string;
    courses: Array<{ title: string; duration: string; provider: string; priority: string }>;
    mentorshipPlan: string;
    estimatedDuration: string;
    successMetrics: string[];
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
Generate personalized training plan for:
- Employee: ${employee.firstName}
- Current Role: ${employee.designation}
- Target Role: ${targetRole || 'Career growth'}
- Performance: ${employee.epistemicConfidence}

Provide: currentLevel, targetLevel, courses (array with title, duration, provider, priority), mentorshipPlan, estimatedDuration, successMetrics (array).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert L&D strategist. Create comprehensive, achievable training plans with measurable outcomes.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 512,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      return {
        currentLevel: 'Intermediate',
        targetLevel: 'Advanced',
        courses: [],
        mentorshipPlan: 'Assign senior mentor',
        estimatedDuration: '6-12 months',
        successMetrics: [],
      };
    }
  }

  /**
   * Recommend organizational talent redistribution
   */
  async recommendTalentRedistribution(): Promise<{
    highPotentialEmployees: Array<{ employeeId: string; name: string; currentDept: string; recommendedMoves: string[] }>;
    bottleneckRoles: Array<{ role: string; currentStaffing: number; recommendedStaffing: number }>;
    redistributionStrategy: string;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employees = await this.employeeRepo.find({
      where: { tenantId: tenantId },
      relations: ['department', 'performance'],
    });

    const prompt = `
Analyze talent distribution across organization (${employees.length} employees).
Recommend redistribution to optimize organizational effectiveness.

Provide: highPotentialEmployees (array with employeeId, name, currentDept, recommendedMoves), bottleneckRoles (array), redistributionStrategy (string).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert organizational strategist. Optimize talent placement and career growth.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 512,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      return {
        highPotentialEmployees: [],
        bottleneckRoles: [],
        redistributionStrategy: 'Manual assessment required',
      };
    }
  }

  /**
   * Recommend compensation adjustments based on market rates
   */
  async recommendCompensationAdjustments(): Promise<{
    adjustments: Array<{ employeeId: string; name: string; currentSalary: number; recommendedSalary: number; rationale: string }>;
    budgetImpact: number;
    recommendations: string[];
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employees = await this.employeeRepo.find({
      where: { tenantId: tenantId },
      take: 50,
    });

    const prompt = `
Analyze compensation for ${employees.length} employees and recommend market-rate adjustments.

Provide: adjustments (array with employeeId, name, currentSalary, recommendedSalary, rationale), budgetImpact, recommendations (array).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert compensation analyst. Recommend fair, competitive pay adjustments.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 512,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      return {
        adjustments: [],
        budgetImpact: 0,
        recommendations: ['Conduct market rate analysis'],
      };
    }
  }
}
