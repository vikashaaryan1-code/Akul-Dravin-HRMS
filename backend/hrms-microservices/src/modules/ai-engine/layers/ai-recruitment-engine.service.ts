import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../ai-provider.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RecruitmentJobEntity } from '../../../database/entities/recruitment-job.entity';
import { CandidateProfileEntity } from '../../../database/entities/candidate-profile.entity';
import { RecruitmentApplicationEntity } from '../../../database/entities/recruitment-application.entity';
import { TenantContext } from '../../../common/context/tenant-context';

/**
 * LAYER 2: AI RECRUITMENT ENGINE (Hiring Automation)
 *
 * Responsibilities:
 *   - Job description generation
 *   - CV parsing & extraction
 *   - Candidate screening pipelines
 *   - Cognitive match scoring
 *   - Interview scheduling automation
 */
@Injectable()
export class AiRecruitmentEngineService {
  private readonly logger = new Logger(AiRecruitmentEngineService.name);

  constructor(
    private readonly aiProvider: AiProviderService,
    @InjectRepository(RecruitmentJobEntity)
    private readonly jobRepo: Repository<RecruitmentJobEntity>,
    @InjectRepository(CandidateProfileEntity)
    private readonly candidateRepo: Repository<CandidateProfileEntity>,
    @InjectRepository(RecruitmentApplicationEntity)
    private readonly applicationRepo: Repository<RecruitmentApplicationEntity>,
  ) {}

  /**
   * Generate professional job description
   */
  async generateJobDescription(jobTitle: string, department: string, level: string, responsibilities: string[]): Promise<{
    title: string;
    description: string;
    requirements: string[];
    keySkills: string[];
    benefits: string[];
  }> {
    const prompt = `
Generate a professional job description for:
- Title: ${jobTitle}
- Department: ${department}
- Level: ${level}
- Key Responsibilities: ${responsibilities.join(', ')}

Format response as JSON with: title, description (markdown), requirements (array), keySkills (array), benefits (array).
Make it compelling and specific to the role.
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter generating compelling, specific job descriptions that attract top talent.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 1024,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      this.logger.error(`Job description generation failed: ${e.message}`);
      return {
        title: jobTitle,
        description: `Position: ${jobTitle} in ${department}`,
        requirements: ['Professional experience', 'Relevant skills'],
        keySkills: [],
        benefits: [],
      };
    }
  }

  /**
   * Parse resume/CV and extract structured data
   */
  async parseResume(resumeText: string): Promise<{
    name: string;
    email: string;
    phone: string;
    experience: Array<{ company: string; position: string; duration: string; description: string }>;
    education: Array<{ institution: string; degree: string; field: string; year: string }>;
    skills: string[];
    certifications: string[];
  }> {
    const prompt = `
Parse this resume and extract structured data:

${resumeText}

Respond with JSON containing: name, email, phone, experience (array with company, position, duration, description), education (array with institution, degree, field, year), skills (array), certifications (array).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at parsing resumes. Extract all information accurately and structure it as JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      maxTokens: 1024,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      this.logger.error(`Resume parsing failed: ${e.message}`);
      return {
        name: 'Unknown',
        email: '',
        phone: '',
        experience: [],
        education: [],
        skills: [],
        certifications: [],
      };
    }
  }

  /**
   * Screen candidates against job requirements
   */
  async screenCandidate(applicationId: string): Promise<{
    score: number; // 0-100
    status: 'PASS' | 'FAIL' | 'REVIEW';
    strengths: string[];
    gaps: string[];
    recommendation: string;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId, tenantId: tenantId },
      relations: ['job', 'candidate'],
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const prompt = `
Screen candidate against job requirements:

Job Requirements: ${application.job.description}
Candidate Profile: ${application.candidate.resumeText}

Evaluate fit and provide: score (0-100), status (PASS/FAIL/REVIEW), strengths (array), gaps (array), recommendation (string).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter screening candidates. Be objective and thorough.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 512,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      this.logger.error(`Candidate screening failed: ${e.message}`);
      return {
        score: 50,
        status: 'REVIEW',
        strengths: [],
        gaps: [],
        recommendation: 'Manual review required',
      };
    }
  }

  /**
   * Generate interview questions tailored to role
   */
  async generateInterviewQuestions(jobTitle: string, department: string, seniority: string): Promise<{
    technicalQuestions: string[];
    behavioralQuestions: string[];
    cultureQuestionsangers: string[];
    evaluationCriteria: Record<string, string>;
  }> {
    const prompt = `
Generate interview questions for:
- Position: ${jobTitle}
- Department: ${department}
- Seniority: ${seniority}

Provide: technicalQuestions (4), behavioralQuestions (4), cultureQuestions (3), evaluationCriteria (object with scoring guides).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview designer creating role-specific, behavioral, and culture-fit questions.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 1024,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      this.logger.error(`Interview questions generation failed: ${e.message}`);
      return {
        technicalQuestions: [],
        behavioralQuestions: [],
        cultureQuestionsangers: [],
        evaluationCriteria: {},
      };
    }
  }
}
