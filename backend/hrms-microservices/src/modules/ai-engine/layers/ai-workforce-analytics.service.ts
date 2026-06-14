import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../ai-provider.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeEntity } from '../../../database/entities/employee.entity';
import { TenantContext } from '../../../common/context/tenant-context';

/**
 * LAYER 4: AI WORKFORCE ANALYTICS (Predictive Forecasting)
 *
 * Responsibilities:
 *   - Turnover/attrition risk prediction (target 90%+ accuracy)
 *   - Organizational skill gap mapping
 *   - Demand forecasting
 *   - Succession planning
 */
@Injectable()
export class AiWorkforceAnalyticsService {
  private readonly logger = new Logger(AiWorkforceAnalyticsService.name);

  constructor(
    private readonly aiProvider: AiProviderService,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  /**
   * Predict attrition risk for an employee (target 90%+ accuracy)
   */
  async predictAttritionRisk(employeeId: string): Promise<{
    riskScore: number; // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    probabilityToLeave: number; // percentage
    timeframeMonths: number;
    riskFactors: Array<{ factor: string; severity: string; evidence: string }>;
    retentionStrategies: string[];
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenantId: tenantId },
      relations: ['attendance', 'leaveRequests', 'performance'],
    });

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const prompt = `
Analyze attrition risk for employee:
- Tenure: ${Math.floor((Date.now() - new Date(employee.joinDate).getTime()) / (30 * 24 * 3600 * 1000))} months
- Performance: ${employee.epistemicConfidence}
- Salary: ${employee.monthlyCtc}
- Recent activity: Last attendance ${employee.exitDate || 'Recently'}

Provide: riskScore (0-100), riskLevel (LOW/MEDIUM/HIGH/CRITICAL), probabilityToLeave (%), timeframeMonths, riskFactors (array), retentionStrategies (array).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR analytics system. Predict attrition risk based on behavioral patterns and engagement metrics.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      maxTokens: 512,
    });

    try {
      const parsed = JSON.parse(result.content);
      return {
        riskScore: Math.min(100, Math.max(0, parsed.riskScore || 50)),
        riskLevel: parsed.riskLevel || 'MEDIUM',
        probabilityToLeave: parsed.probabilityToLeave || 30,
        timeframeMonths: parsed.timeframeMonths || 12,
        riskFactors: parsed.riskFactors || [],
        retentionStrategies: parsed.retentionStrategies || [],
      };
    } catch (err) { const e = err as any;
      return {
        riskScore: 50,
        riskLevel: 'MEDIUM',
        probabilityToLeave: 30,
        timeframeMonths: 12,
        riskFactors: [],
        retentionStrategies: [],
      };
    }
  }

  /**
   * Forecast skill gaps across organization
   */
  async forecastSkillGaps(): Promise<{
    criticalGaps: Array<{ skill: string; currentCount: number; projectedDemand: number; gap: number }>;
    timeline: string;
    recommendations: string[];
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employees = await this.employeeRepo.find({
      where: { tenantId: tenantId },
      relations: ['skills'],
    });

    const prompt = `
Analyze organizational skill gaps for ${employees.length} employees.
Top skills present: ${employees.length > 0 ? 'Diverse' : 'Limited'}

Identify: criticalGaps (array with skill, currentCount, projectedDemand, gap), timeline (6-12 month outlook), recommendations (array).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert workforce planner. Identify critical skill gaps and forecast organizational needs.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      maxTokens: 512,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      return {
        criticalGaps: [],
        timeline: '6-12 months',
        recommendations: ['Conduct comprehensive skills audit', 'Develop training programs'],
      };
    }
  }

  /**
   * Generate succession plan for key roles
   */
  async generateSuccessionPlan(roleId: string): Promise<{
    criticalRole: string;
    successors: Array<{ employeeId: string; name: string; readinessScore: number; developmentGaps: string[] }>;
    developmentPlan: string;
    timeline: string;
  }> {
    const prompt = `
Generate succession plan for role: ${roleId}

Provide: criticalRole (string), successors (array with employeeId, name, readinessScore 0-100, developmentGaps), developmentPlan (string), timeline (string).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert succession planner. Identify and develop internal talent for key roles.',
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
        criticalRole: roleId,
        successors: [],
        developmentPlan: 'Not available',
        timeline: '12-24 months',
      };
    }
  }
}
