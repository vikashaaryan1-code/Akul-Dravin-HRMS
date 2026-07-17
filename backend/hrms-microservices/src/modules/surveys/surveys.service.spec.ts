import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SurveysService } from './surveys.service';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { SurveyResponseEntity } from '../../database/entities/survey-response.entity';

class MockQueryBuilder {
  constructor(private readonly mockData: any) {}

  orderBy = jest.fn().mockReturnThis();
  select = jest.fn().mockReturnThis();
  addSelect = jest.fn().mockReturnThis();
  where = jest.fn().mockReturnThis();
  andWhere = jest.fn().mockReturnThis();
  groupBy = jest.fn().mockReturnThis();
  getMany = jest.fn().mockImplementation(() => Promise.resolve(this.mockData));
  getRawMany = jest.fn().mockImplementation(() => Promise.resolve(this.mockData));
  getRawOne = jest.fn().mockImplementation(() => Promise.resolve(this.mockData));
}

describe('SurveysService', () => {
  let service: SurveysService;
  let surveyRepoMock: any;
  let responseRepoMock: any;

  beforeEach(async () => {
    surveyRepoMock = {
      createQueryBuilder: jest.fn(),
    };
    responseRepoMock = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveysService,
        {
          provide: getRepositoryToken(SurveyEntity),
          useValue: surveyRepoMock,
        },
        {
          provide: getRepositoryToken(SurveyResponseEntity),
          useValue: responseRepoMock,
        },
      ],
    }).compile();

    service = module.get<SurveysService>(SurveysService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSurveys', () => {
    it('should return empty list if no surveys found', async () => {
      const surveyBuilder = new MockQueryBuilder([]);
      surveyRepoMock.createQueryBuilder.mockReturnValue(surveyBuilder);

      const result = await service.getSurveys('tenant-1');
      expect(result).toEqual([]);
      expect(surveyRepoMock.createQueryBuilder).toHaveBeenCalledWith('survey');
      expect(surveyBuilder.orderBy).toHaveBeenCalledWith('survey.createdAt', 'DESC');
    });

    it('should return surveys with matching respondents count from grouped counts query', async () => {
      const mockSurveys = [
        { id: 's-1', title: 'Survey 1', tenantId: 'tenant-1' },
        { id: 's-2', title: 'Survey 2', tenantId: 'tenant-1' },
      ];
      const mockCounts = [
        { surveyId: 's-1', count: '5' },
        { surveyId: 's-2', count: '12' },
      ];

      const surveyBuilder = new MockQueryBuilder(mockSurveys);
      const responseBuilder = new MockQueryBuilder(mockCounts);

      surveyRepoMock.createQueryBuilder.mockReturnValue(surveyBuilder);
      responseRepoMock.createQueryBuilder.mockReturnValue(responseBuilder);

      const result = await service.getSurveys('tenant-1');

      expect(result).toEqual([
        { id: 's-1', title: 'Survey 1', tenantId: 'tenant-1', respondents: 5 },
        { id: 's-2', title: 'Survey 2', tenantId: 'tenant-1', respondents: 12 },
      ]);

      expect(surveyRepoMock.createQueryBuilder).toHaveBeenCalledWith('survey');
      expect(responseRepoMock.createQueryBuilder).toHaveBeenCalledWith('response');
      expect(responseBuilder.select).toHaveBeenCalledWith('response.survey_id', 'surveyId');
      expect(responseBuilder.addSelect).toHaveBeenCalledWith('COUNT(response.id)', 'count');
      expect(responseBuilder.groupBy).toHaveBeenCalledWith('response.survey_id');
    });
  });

  describe('getEnpsMetrics', () => {
    it('should return score 0 and pct 0 if no responses found', async () => {
      const responseBuilder = new MockQueryBuilder({
        total: '0',
        promotersCount: '0',
        passivesCount: '0',
        detractorsCount: '0',
      });
      responseRepoMock.createQueryBuilder.mockReturnValue(responseBuilder);

      const result = await service.getEnpsMetrics('tenant-1');

      expect(result).toEqual({ score: 0, promoters: 0, passives: 0, detractors: 0 });
      expect(responseRepoMock.createQueryBuilder).toHaveBeenCalledWith('response');
    });

    it('should calculate ENPS metrics correctly from DB aggregates', async () => {
      const responseBuilder = new MockQueryBuilder({
        total: '10',
        promotersCount: '6', // 60%
        passivesCount: '3',   // 30%
        detractorsCount: '1', // 10%
      });
      responseRepoMock.createQueryBuilder.mockReturnValue(responseBuilder);

      const result = await service.getEnpsMetrics('tenant-1');

      // ENPS score is promoters % (60) - detractors % (10) = 50
      expect(result).toEqual({
        score: 50,
        promoters: 60,
        passives: 30,
        detractors: 10,
      });
    });

    it('should handle zero detractors or promoters correctly', async () => {
      const responseBuilder = new MockQueryBuilder({
        total: '5',
        promotersCount: '0',
        passivesCount: '5',
        detractorsCount: '0',
      });
      responseRepoMock.createQueryBuilder.mockReturnValue(responseBuilder);

      const result = await service.getEnpsMetrics('tenant-1');

      expect(result).toEqual({
        score: 0,
        promoters: 0,
        passives: 100,
        detractors: 0,
      });
    });
  });
});
