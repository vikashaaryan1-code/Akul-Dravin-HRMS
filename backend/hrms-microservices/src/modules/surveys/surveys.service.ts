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
   * PERFORMANCE OPTIMIZATION (Bolt ⚡):
   * Replaced N-loop queries (N+1 query problem) with 2 consolidated queries:
   * 1 query to fetch tenant surveys, and 1 grouped aggregation query for respondent counts.
   * Total queries reduced from 1 + N to a constant 2 queries (or 1 if no surveys found),
   * scaling O(1) in DB roundtrips regardless of survey count.
   * Multi-tenant data isolation is enforced via TenantQueryPolicy.
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
   * PERFORMANCE OPTIMIZATION (Bolt ⚡):
   * Replaced in-memory entity fetching and JS array iteration with a single database SQL
   * conditional aggregation query (SUM/CASE + COUNT) using TypeORM createQueryBuilder.
   * Eliminates O(M) entity allocations and network transfer, reducing database roundtrips to 1
   * and returning only a single aggregated row.
   * Multi-tenant data isolation is enforced via TenantQueryPolicy.
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
