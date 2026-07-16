import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SurveysService } from './surveys.service';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { SurveyResponseEntity } from '../../database/entities/survey-response.entity';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';

describe('SurveysService', () => {
  let service: SurveysService;
  let surveyRepo: any;

  beforeEach(async () => {
    const mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockImplementation((cb, alias) => {
          // Manually invoke the callback to ensure subquery logic is "hit"
          const subqb = {
              select: jest.fn().mockReturnThis(),
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
          };
          cb(subqb);
          return mockQueryBuilder;
      }),
      orderBy: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: [{ id: 's1', title: 'Survey 1' }],
        raw: [{ respondentsCount: '5' }],
      }),
    };

    surveyRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveysService,
        {
          provide: getRepositoryToken(SurveyEntity),
          useValue: surveyRepo,
        },
        {
          provide: getRepositoryToken(SurveyResponseEntity),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SurveysService>(SurveysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSurveys', () => {
    it('should return surveys with respondent counts', async () => {
      const result = await service.getSurveys('tenant-1');
      expect(result).toEqual([
        { id: 's1', title: 'Survey 1', respondents: 5 },
      ]);
      expect(surveyRepo.createQueryBuilder).toHaveBeenCalledWith('s');

      // Verify that the query builder was called with the correct property names
      const mockQb = surveyRepo.createQueryBuilder();
      expect(mockQb.orderBy).toHaveBeenCalledWith('s.createdAt', 'DESC');
    });
  });
});
