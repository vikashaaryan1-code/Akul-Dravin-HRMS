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

  /**
   * Optimizes N+1 query vulnerability to O(1) database queries (exactly 2 queries)
   * using a single grouped count query, fully governed by TenantQueryPolicy.
   */
  async getSurveys(tenantId: string) {
    const qb = this.surveyRepo.createQueryBuilder('survey');
    TenantQueryPolicy.enforce(qb, tenantId, 'survey', 'SurveysService', 'getSurveys');
    qb.orderBy('survey.createdAt', 'DESC');

    const surveys = await qb.getMany();
    if (surveys.length === 0) {
      return [];
    }

    const countQb = this.responseRepo.createQueryBuilder('response');
    TenantQueryPolicy.enforce(countQb, tenantId, 'response', 'SurveysService', 'getSurveysCounts');
    countQb
      .select('response.survey_id', '"surveyId"')
      .addSelect('COUNT(response.id)', 'count')
      .groupBy('response.survey_id');

    const counts = await countQb.getRawMany();
    const countMap = new Map<string, number>();
    for (const row of counts) {
      countMap.set(row.surveyId, parseInt(row.count, 10) || 0);
    }

    return surveys.map(s => ({
      ...s,
      respondents: countMap.get(s.id) || 0
    }));
  }

  /**
   * Optimizes in-memory computation of ENPS metrics to a single database aggregate query (SUM/CASE)
   * reducing database memory usage, network payload, and keeping the logic 100% database-side.
   * Fully governed by TenantQueryPolicy.
   */
  async getEnpsMetrics(tenantId: string) {
    const qb = this.responseRepo.createQueryBuilder('response');
    TenantQueryPolicy.enforce(qb, tenantId, 'response', 'SurveysService', 'getEnpsMetrics');

    qb.select([
      'COUNT(response.id) AS total',
      'SUM(CASE WHEN response.nps_score >= 9 THEN 1 ELSE 0 END) AS "promotersCount"',
      'SUM(CASE WHEN response.nps_score >= 7 AND response.nps_score <= 8 THEN 1 ELSE 0 END) AS "passivesCount"',
      'SUM(CASE WHEN response.nps_score < 7 THEN 1 ELSE 0 END) AS "detractorsCount"'
    ]);

    const result = await qb.getRawOne();
    
    const total = parseInt(result?.total, 10) || 0;
    if (total === 0) {
      return { score: 0, promoters: 0, passives: 0, detractors: 0 };
    }

    const promoters = parseInt(result?.promotersCount, 10) || 0;
    const passives = parseInt(result?.passivesCount, 10) || 0;
    const detractors = parseInt(result?.detractorsCount, 10) || 0;

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
