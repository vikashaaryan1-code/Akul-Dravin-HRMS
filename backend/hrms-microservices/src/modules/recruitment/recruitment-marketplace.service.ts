import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { CandidateProfileEntity } from '../../database/entities/candidate-profile.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { AiEngineService } from '../ai-engine/ai-engine.service';

@Injectable()
export class RecruitmentMarketplaceService {
  private readonly logger = new Logger(RecruitmentMarketplaceService.name);

  constructor(
    @InjectRepository(RecruitmentJobEntity)
    private readonly jobRepo: Repository<RecruitmentJobEntity>,
    @InjectRepository(CandidateProfileEntity)
    private readonly candidateRepo: Repository<CandidateProfileEntity>,
    @InjectRepository(RecruitmentApplicationEntity)
    private readonly applicationRepo: Repository<RecruitmentApplicationEntity>,
    private readonly aiEngine: AiEngineService,
  ) {}

  /**
   * Generates a Job Description using AI based on a title and requirements.
   * "Zoho People++" AI JD generation feature.
   */
  async generateAiJobDescription(title: string, requirements: string[]) {
    this.logger.log(`Generating AI JD for title="${title}"`);
    
    const prompt = `Act as a senior HR recruiter. Write a professional, high-converting job description for a "${title}" role.
Requirements: ${requirements.join(', ')}.
Structure: Role Overview, Key Responsibilities, Required Skills, Preferred Qualifications, and Why Join Us.
Tone: Professional, ambitious, and inclusive.`;

    const chatResponse = await this.aiEngine.chat({
      tenantId: 'system',
      userId: 'system',
      messages: [{ role: 'user', content: prompt }],
      context: { module: 'recruitment', action: 'jd-generation' }
    });

    return {
      description: chatResponse.message.content,
      suggestedTitle: title,
      suggestedSkills: requirements,
    };
  }

  /**
   * Lists all jobs visible on the public hiring marketplace.
   * WorkIndia-style marketplace visibility.
   */
  async findMarketplaceJobs() {
    return this.jobRepo.find({
      where: { isMarketplaceVisible: true, status: 'open' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Ranks candidates for a specific job using AI scores and skill match.
   * AI Hiring Engine feature.
   */
  async rankCandidates(jobId: string) {
    const job = await this.jobRepo.findOneBy({ id: jobId });
    if (!job) throw new NotFoundException('Job not found');

    const applications = await this.applicationRepo.find({
      where: { jobId },
    });

    const candidateIds = applications.map(app => app.candidateId);
    if (candidateIds.length === 0) return [];

    const candidates = await this.candidateRepo.findBy({
      id: In(candidateIds),
    });

    const candidateMap = new Map(candidates.map(c => [c.id, c]));

    // Simple ranking based on verified skills match + AI Score
    const ranked = applications.map(app => {
      const candidate = candidateMap.get(app.candidateId);
      if (!candidate) return null;
      const skillMatchCount = job.requiredSkills.filter(s => 
        (candidate.verifiedSkills || []).includes(s) || (candidate.skills || []).includes(s)
      ).length;

      const baseScore = parseFloat(candidate.aiScore) || 50;
      const matchScore = (skillMatchCount / Math.max(1, job.requiredSkills.length)) * 50;
      const finalScore = Math.min(100, baseScore + matchScore);

      return {
        applicationId: app.id,
        candidateName: candidate.fullName,
        matchScore: finalScore.toFixed(2),
        skillMatch: `${skillMatchCount}/${job.requiredSkills.length}`,
        recommendation: finalScore > 80 ? 'STRONG_FIT' : finalScore > 60 ? 'GOOD_FIT' : 'PARTIAL_FIT',
      };
    })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => parseFloat(b.matchScore) - parseFloat(a.matchScore));

    return ranked;
  }

  /**
   * Toggles marketplace visibility for a job posting.
   */
  async toggleMarketplaceVisibility(jobId: string, visible: boolean) {
    const job = await this.jobRepo.findOneBy({ id: jobId });
    if (!job) throw new NotFoundException('Job not found');

    job.isMarketplaceVisible = visible;
    return this.jobRepo.save(job);
  }
}
