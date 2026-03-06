import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';

@Injectable()
export class AiEngineService {
  constructor(
    @InjectRepository(AiInsightEntity)
    private readonly aiInsightRepository: Repository<AiInsightEntity>,
  ) {}

  findAllInsights(): Promise<AiInsightEntity[]> {
    return this.aiInsightRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOneInsight(id: string): Promise<AiInsightEntity | null> {
    return this.aiInsightRepository.findOne({ where: { id } });
  }

  createInsight(payload: Partial<AiInsightEntity>): Promise<AiInsightEntity> {
    const entity = this.aiInsightRepository.create(payload);
    return this.aiInsightRepository.save(entity);
  }

  async updateInsight(id: string, payload: Partial<AiInsightEntity>): Promise<AiInsightEntity | null> {
    await this.aiInsightRepository.update(id, payload);
    return this.findOneInsight(id);
  }

  async generateRecommendation(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      module: payload.module ?? 'general',
      recommendation: 'Implement weighted scoring and human override for high-impact decisions.',
      generatedAt: new Date().toISOString(),
      confidence: 0.88,
    };
  }
}
