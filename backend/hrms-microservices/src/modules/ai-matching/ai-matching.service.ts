import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiMatch } from './ai-match.entity';

@Injectable()
export class AiMatchingService {
  constructor(@InjectRepository(AiMatch) private repo: Repository<AiMatch>) {}

  async matchCandidateToJob(candidateId: string, jobId: string, candidateData: any, jobData: any): Promise<AiMatch> {
    const matchDetails = this.calculateMatch(candidateData, jobData);
    const matchScore = this.calculateOverallScore(matchDetails);
    
    const match = this.repo.create({
      candidateId,
      jobId,
      matchScore,
      matchDetails,
      status: 'active'
    });
    
    return this.repo.save(match);
  }

  private calculateMatch(candidate: any, job: any): any {
    const details: any = {};
    
    // Skill matching
    const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
    const jobSkills = (job.requiredSkills || []).map((s: string) => s.toLowerCase());
    
    const matchedSkills = candidateSkills.filter((s: string) => jobSkills.includes(s));
    const missingSkills = jobSkills.filter((s: string) => !candidateSkills.includes(s));
    
    details.matchedSkills = matchedSkills;
    details.missingSkills = missingSkills;
    details.skillMatch = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 100 : 0;
    
    // Experience matching
    const candidateExp = candidate.totalExperience || 0;
    const requiredExp = job.minExperience || 0;
    
    if (candidateExp >= requiredExp) {
      details.experienceMatch = 100;
    } else {
      details.experienceMatch = (candidateExp / requiredExp) * 100;
    }
    
    // Education matching (simplified)
    details.educationMatch = candidate.education?.length > 0 ? 80 : 50;
    
    // Location matching (simplified)
    details.locationMatch = 70;
    
    // Salary matching (simplified)
    details.salaryMatch = 75;
    
    // Generate recommendations
    details.recommendations = this.generateRecommendations(matchedSkills, missingSkills, candidateExp, requiredExp);
    
    return details;
  }

  private calculateOverallScore(details: any): number {
    const weights = {
      skillMatch: 0.40,
      experienceMatch: 0.30,
      educationMatch: 0.15,
      locationMatch: 0.10,
      salaryMatch: 0.05
    };
    
    const score = 
      (details.skillMatch * weights.skillMatch) +
      (details.experienceMatch * weights.experienceMatch) +
      (details.educationMatch * weights.educationMatch) +
      (details.locationMatch * weights.locationMatch) +
      (details.salaryMatch * weights.salaryMatch);
    
    return Math.round(score * 100) / 100;
  }

  private generateRecommendations(matched: string[], missing: string[], candidateExp: number, requiredExp: number): string[] {
    const recommendations = [];
    
    if (matched.length > 0) {
      recommendations.push(`Strong match on ${matched.length} key skills: ${matched.slice(0, 3).join(', ')}`);
    }
    
    if (missing.length > 0) {
      recommendations.push(`Consider training in: ${missing.slice(0, 3).join(', ')}`);
    }
    
    if (candidateExp >= requiredExp) {
      recommendations.push('Experience requirement met');
    } else {
      recommendations.push(`Needs ${requiredExp - candidateExp} more years of experience`);
    }
    
    return recommendations;
  }

  async findTopMatches(jobId: string, limit: number = 10): Promise<AiMatch[]> {
    return this.repo.find({
      where: { jobId, status: 'active' },
      order: { matchScore: 'DESC' },
      take: limit
    });
  }

  async findCandidateMatches(candidateId: string): Promise<AiMatch[]> {
    return this.repo.find({
      where: { candidateId, status: 'active' },
      order: { matchScore: 'DESC' }
    });
  }

  async findAll(): Promise<AiMatch[]> {
    return this.repo.find({ order: { matchScore: 'DESC' } });
  }

  async findOne(id: string): Promise<AiMatch> {
    return this.repo.findOne({ where: { id } });
  }

  async getStats(): Promise<any> {
    const total = await this.repo.count();
    const highMatch = await this.repo.count({ where: { status: 'active' } });
    
    return { total, highMatch };
  }
}
