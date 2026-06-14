import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../ai-provider.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CandidateProfileEntity } from '../../../database/entities/candidate-profile.entity';
import { TenantContext } from '../../../common/context/tenant-context';

/**
 * LAYER 3: AI TALENT INTELLIGENCE (Skill Matrix Mapping)
 *
 * Responsibilities:
 *   - Multidimensional candidate assessment
 *   - Skill Match scoring
 *   - Experience scoring
 *   - Location alignment
 *   - Salary compatibility
 *   - Cultural fit assessment
 *   - Overall match score calculation
 */
@Injectable()
export class AiTalentIntelligenceService {
  private readonly logger = new Logger(AiTalentIntelligenceService.name);

  constructor(
    private readonly aiProvider: AiProviderService,
    @InjectRepository(CandidateProfileEntity)
    private readonly candidateRepo: Repository<CandidateProfileEntity>,
  ) {}

  /**
   * Calculate comprehensive talent match score
   * Formula: OverallMatch = w1*SkillMatch + w2*ExperienceScore + w3*LocationMatch + w4*SalaryMatch + w5*CultureFit
   */
  async calculateTalentScore(candidateId: string, jobId: string, weights?: { skillWeight?: number; experienceWeight?: number; locationWeight?: number; salaryWeight?: number; cultureWeight?: number }): Promise<{
    overallScore: number;
    skillMatch: number;
    experienceScore: number;
    locationMatch: number;
    salaryMatch: number;
    cultureFit: number;
    recommendation: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED';
    detailedAnalysis: string;
  }> {
    const w1 = weights?.skillWeight ?? 0.35;
    const w2 = weights?.experienceWeight ?? 0.25;
    const w3 = weights?.locationWeight ?? 0.15;
    const w4 = weights?.salaryWeight ?? 0.15;
    const w5 = weights?.cultureWeight ?? 0.1;

    const tenantId = TenantContext.getRequiredTenantId();
    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId, tenantId: tenantId } });

    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    const prompt = `
Calculate talent match scores for candidate:
${candidate.resumeText || 'No resume data available'}

Provide scores (0-100) for: skillMatch, experienceScore, locationMatch, salaryMatch, cultureFit.
Also provide detailedAnalysis and recommendation (HIGHLY_RECOMMENDED, RECOMMENDED, CONSIDER, NOT_RECOMMENDED).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert talent evaluator. Score candidates on multiple dimensions with objective criteria.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 512,
    });

    try {
      const parsed = JSON.parse(result.content);
      const skillMatch = Math.min(100, Math.max(0, parsed.skillMatch || 0));
      const experienceScore = Math.min(100, Math.max(0, parsed.experienceScore || 0));
      const locationMatch = Math.min(100, Math.max(0, parsed.locationMatch || 0));
      const salaryMatch = Math.min(100, Math.max(0, parsed.salaryMatch || 0));
      const cultureFit = Math.min(100, Math.max(0, parsed.cultureFit || 0));

      const overallScore = w1 * skillMatch + w2 * experienceScore + w3 * locationMatch + w4 * salaryMatch + w5 * cultureFit;

      return {
        overallScore: Math.round(overallScore),
        skillMatch,
        experienceScore,
        locationMatch,
        salaryMatch,
        cultureFit,
        recommendation: parsed.recommendation || (overallScore > 80 ? 'HIGHLY_RECOMMENDED' : overallScore > 60 ? 'RECOMMENDED' : 'CONSIDER'),
        detailedAnalysis: parsed.detailedAnalysis || 'Assessment complete',
      };
    } catch (err) { const e = err as any;
      this.logger.error(`Talent score calculation failed: ${e.message}`);
      return {
        overallScore: 50,
        skillMatch: 50,
        experienceScore: 50,
        locationMatch: 50,
        salaryMatch: 50,
        cultureFit: 50,
        recommendation: 'CONSIDER',
        detailedAnalysis: 'Automatic scoring unavailable',
      };
    }
  }

  /**
   * Map candidate skills to role requirements
   */
  async mapSkillMatrix(candidateId: string, requiredSkills: string[]): Promise<{
    matched: Array<{ skill: string; proficiency: string; yearsOfExperience: number }>;
    missing: Array<{ skill: string; importance: 'CRITICAL' | 'IMPORTANT' | 'NICE_TO_HAVE'; trainabilityScore: number }>;
    recommendation: string;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId, tenantId: tenantId } });

    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    const prompt = `
Analyze skill gap:
Candidate Profile: ${candidate.resumeText || 'No data'}
Required Skills: ${requiredSkills.join(', ')}

Provide: matched (array with skill, proficiency, yearsOfExperience), missing (array with skill, importance, trainabilityScore 0-100), recommendation.
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are an expert in skill mapping and talent development. Identify gaps and trainability.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      maxTokens: 512,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      return {
        matched: [],
        missing: requiredSkills.map((s) => ({
          skill: s,
          importance: 'IMPORTANT' as const,
          trainabilityScore: 70,
        })),
        recommendation: 'Manual skill assessment required',
      };
    }
  }
}
