import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { SurveyResponseEntity } from '../../database/entities/survey-response.entity';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(SurveyEntity)
    private readonly surveyRepo: Repository<SurveyEntity>,
    @InjectRepository(SurveyResponseEntity)
    private readonly responseRepo: Repository<SurveyResponseEntity>,
  ) {}

  async getSurveys(tenantId: string) {
    const qb = this.surveyRepo.createQueryBuilder('survey');
    TenantQueryPolicy.enforce(qb, tenantId, 'survey', 'SurveysService', 'getSurveys');

    const surveys = await qb
      .orderBy('survey.createdAt', 'DESC')
      .getMany();

    if (surveys.length === 0) return [];

    // Optimize N+1: Fetch all respondent counts in one query
    const countsResult = await this.responseRepo.createQueryBuilder('response')
      .select('response.surveyId', 'surveyId')
      .addSelect('COUNT(*)', 'count')
      .where('response.tenantId = :tenantId', { tenantId })
      .groupBy('response.surveyId')
      .getRawMany();

    const countMap = new Map(countsResult.map(c => [c.surveyId, parseInt(c.count, 10)]));

    return surveys.map(s => ({
      ...s,
      respondents: countMap.get(s.id) || 0
    }));
  }

  async getEnpsMetrics(tenantId: string) {
    const qb = this.responseRepo.createQueryBuilder('response');
    TenantQueryPolicy.enforce(qb, tenantId, 'response', 'SurveysService', 'getEnpsMetrics');

    const result = await qb
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN response.nps_score >= 9 THEN 1 ELSE 0 END)', 'promoters')
      .addSelect('SUM(CASE WHEN response.nps_score >= 7 AND response.nps_score < 9 THEN 1 ELSE 0 END)', 'passives')
      .addSelect('SUM(CASE WHEN response.nps_score < 7 THEN 1 ELSE 0 END)', 'detractors')
      .getRawOne();
    
    const total = parseInt(result.total, 10) || 0;
    if (total === 0) {
      return { score: 0, promoters: 0, passives: 0, detractors: 0 };
    }

    const promoters = parseInt(result.promoters, 10) || 0;
    const passives = parseInt(result.passives, 10) || 0;
    const detractors = parseInt(result.detractors, 10) || 0;

    const promoterPct = Math.round((promoters / total) * 100);
    const passivePct = Math.round((passives / total) * 100);
    const detractorPct = Math.round((detractors / total) * 100);
    
    return {
      score: promoterPct - detractorPct,
      promoters: promoterPct,
      passives: passivePct,
      detractors: detractorPct,
    };
  }
}
