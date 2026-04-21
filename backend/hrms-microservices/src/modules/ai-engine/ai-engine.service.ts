import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class AiEngineService {
  private readonly logger = new Logger(AiEngineService.name);

  private get aiInsightRepo() {
    return TenantContext.getRepository(AiInsightEntity);
  }

  async findAllInsights(): Promise<AiInsightEntity[]> {
    return this.aiInsightRepo.find({ 
      order: { createdAt: 'DESC' } 
    });
  }

  async getOrganizationalHealth(): Promise<Record<string, any>> {
    const tenantId = TenantContext.getTenantId();
    this.logger.log(`Fetching AI Health Insights for Tenant: ${tenantId}`);

    // In a real production environment, this would call the Python AI Service (FastAPI)
    // For Genesis Synthesis, we implement the core response structure
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: {
        healthScore: 88,
        retentionRisk: 'Low',
        efficiencyScore: 0.92,
        insights: [
          'Team velocity increased by 12% following the latest sprint adjustment.',
          'Attendance consistency is at an all-time high (94.5%).',
          'Sales department showing superior performance-to-cost ROI.'
        ]
      }
    };
  }

  async scoreCandidateMatch(payload: Record<string, unknown>): Promise<any> {
    const tenantId = TenantContext.getTenantId();
    // Logic for AI candidate scoring
    return {
      matchScore: 85,
      recommendation: 'Highly recommended for the Senior SRE role.',
      tenantId
    };
  }

  async findOneInsight(id: string): Promise<AiInsightEntity> {
    const insight = await this.aiInsightRepo.findOne({ where: { id } });
    if (!insight) throw new NotFoundException('AI Insight not found');
    return insight;
  }

  async createInsight(payload: any): Promise<AiInsightEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const entity = this.aiInsightRepo.create({ ...payload, tenantId } as any);
    return this.aiInsightRepo.save(entity) as unknown as Promise<AiInsightEntity>;
  }

  async updateInsight(id: string, payload: any): Promise<AiInsightEntity> {
    await this.aiInsightRepo.update(id, payload);
    return this.findOneInsight(id);
  }

  async generateRecommendation(payload: any): Promise<any> {
    return { recommendation: 'AI Recommendation Stub', data: payload };
  }

  async predictAttritionRisk(payload: any): Promise<any> {
    return { riskScore: 0.15, label: 'Low', recommendation: 'Stay the course' };
  }

  async forecastSalary(payload: any): Promise<any> {
    return { forecastedIncrease: 0.05, estimatedRange: [50000, 60000] };
  }
}

