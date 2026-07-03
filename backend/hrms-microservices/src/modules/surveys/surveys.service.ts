import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { SurveyResponseEntity } from '../../database/entities/survey-response.entity';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(SurveyEntity)
    private readonly surveyRepo: Repository<SurveyEntity>,
    @InjectRepository(SurveyResponseEntity)
    private readonly responseRepo: Repository<SurveyResponseEntity>,
  ) {}

  async getSurveys(tenantId: string) {
    const surveys = await this.surveyRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' }
    });

    const results = [];
    for (const s of surveys) {
      const respCount = await this.responseRepo.count({ where: { surveyId: s.id } });
      results.push({
        ...s,
        respondents: respCount
      });
    }

    return results;
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
