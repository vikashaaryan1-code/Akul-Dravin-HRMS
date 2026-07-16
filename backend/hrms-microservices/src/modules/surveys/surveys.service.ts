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
   * Fetches all surveys for a tenant with respondent counts.
   * Optimized to resolve N+1 query bottleneck using a subquery in a single database round-trip.
   */
  async getSurveys(tenantId: string) {
    const qb = this.surveyRepo.createQueryBuilder('s');

    // Enforce tenant isolation via governance policy
    TenantQueryPolicy.enforce(qb, tenantId, 's', 'SurveysService', 'getSurveys');

    // Subquery to count respondents per survey
    qb.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(sr.id)', 'count')
        .from(SurveyResponseEntity, 'sr')
        .where('sr.surveyId = s.id');
    }, 'respondentsCount');

    qb.orderBy('s.createdAt', 'DESC');

    const { entities, raw } = await qb.getRawAndEntities();

    return entities.map((survey, index) => ({
      ...survey,
      respondents: parseInt(raw[index].respondentsCount, 10) || 0,
    }));
  }

  async getEnpsMetrics(tenantId: string) {
    const responses = await this.responseRepo.find({ where: { tenantId } });
    
    if (responses.length === 0) {
      return { score: 0, promoters: 0, passives: 0, detractors: 0 };
    }

    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    responses.forEach(r => {
      if (r.npsScore >= 9) promoters++;
      else if (r.npsScore >= 7) passives++;
      else detractors++;
    });

    const total = responses.length;
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
