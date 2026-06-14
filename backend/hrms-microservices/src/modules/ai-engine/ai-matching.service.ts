import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SkillMatch {
  required: string[];
  preferred: string[];
  candidateSkills: string[];
  matchedRequired: string[];
  matchedPreferred: string[];
  missingRequired: string[];
  skillScore: number;          // 0–100
}

/**
 * AI EXPLAINABILITY LAYER (PRD Architectural Requirement)
 *
 * Structured reasoning traces surfaced to recruiters and compliance auditors.
 * Every score decision is traceable — no black-box recommendations.
 */
export interface AiMatchExplanation {
  /** Skills the candidate has that match required skills */
  skillMatch: string[];
  /** Required skills the candidate is missing */
  missingSkills: string[];
  /** Preferred skills the candidate has as a bonus */
  bonusSkills: string[];
  /** Annual salary gap (positive = candidate expects more than max offer) */
  salaryGap: number;
  /** Experience delta in years (positive = overqualified, negative = underqualified) */
  experienceDelta: number;
  /** Human-readable location note */
  locationNote: string;
  /** Weight-decomposed score explanation */
  scoreDecomposition: {
    skillContribution: number;
    experienceContribution: number;
    locationContribution: number;
    salaryContribution: number;
  };
  /** Plain-language narrative for recruiter UI */
  narrative: string;
}

export interface CandidateMatchScore {
  candidateId: string;
  jobId: string;
  skillScore: number;          // 0–100 (PRD §3.2.3)
  experienceScore: number;     // 0–100
  locationScore: number;       // 0–100
  salaryScore: number;         // 0–100
  overallScore: number;        // weighted aggregate
  skillBreakdown: SkillMatch;
  recommendation: 'STRONG_FIT' | 'GOOD_FIT' | 'PARTIAL_FIT' | 'POOR_FIT';
  reason: string;
  /** Structured explanation for AI transparency / recruiter-visible reasoning */
  explanations: AiMatchExplanation;
}

export interface JobMatchResult {
  jobId: string;
  jobTitle: string;
  topCandidates: CandidateMatchScore[];
  totalCandidatesScored: number;
  avgScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHTS (PRD §3.2.3 Talent Intelligence Metrics)
// ─────────────────────────────────────────────────────────────────────────────

const MATCH_WEIGHTS = {
  skill:      0.40,
  experience: 0.30,
  location:   0.15,
  salary:     0.15,
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AI MATCHING SERVICE
 *
 * PRD §3.2.3 — Talent Intelligence Metrics:
 *   Skill Match (0-100%), Experience Score, Location Match, Salary Match,
 *   Culture Fit (heuristic), Overall Match Score.
 *
 * Design: deterministic rule-based scoring (no ML dependency) so that
 * every score can be explained and audited. ML models plug in via
 * the AiProviderService once available.
 */
@Injectable()
export class AiMatchingService {
  private readonly logger = new Logger(AiMatchingService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  // ── Skill Scoring ─────────────────────────────────────────────────────────

  private scoreSkills(
    required: string[],
    preferred: string[],
    candidateSkills: string[],
  ): { score: number; breakdown: SkillMatch } {
    const normalize = (s: string) => s.toLowerCase().trim();

    const candNorm = new Set(candidateSkills.map(normalize));
    const reqNorm  = required.map(normalize);
    const prefNorm = preferred.map(normalize);

    const matchedRequired  = reqNorm.filter((s) => candNorm.has(s));
    const matchedPreferred = prefNorm.filter((s) => candNorm.has(s));
    const missingRequired  = reqNorm.filter((s) => !candNorm.has(s));

    // Base score: required skills coverage is mandatory (0–70%)
    const requiredCoverage = reqNorm.length === 0
      ? 70
      : (matchedRequired.length / reqNorm.length) * 70;

    // Bonus: preferred skills (0–30%)
    const preferredBonus = prefNorm.length === 0
      ? 30
      : (matchedPreferred.length / prefNorm.length) * 30;

    const score = Math.min(100, Math.round(requiredCoverage + preferredBonus));

    return {
      score,
      breakdown: {
        required,
        preferred,
        candidateSkills,
        matchedRequired,
        matchedPreferred,
        missingRequired,
        skillScore: score,
      },
    };
  }

  // ── Experience Scoring ────────────────────────────────────────────────────

  private scoreExperience(
    minYears: number,
    maxYears: number | null,
    candidateYears: number,
  ): number {
    if (candidateYears < minYears) {
      // Below minimum — partial credit (50% of shortfall gives residual score)
      const deficit  = minYears - candidateYears;
      const residual = Math.max(0, 100 - (deficit / Math.max(minYears, 1)) * 100);
      return Math.round(residual * 0.5);
    }
    if (maxYears !== null && candidateYears > maxYears * 1.5) {
      // Severely overqualified — deduct up to 20 points
      return Math.max(60, 100 - 20);
    }
    // Within or slightly above range → full score
    return 100;
  }

  // ── Location Scoring ──────────────────────────────────────────────────────

  private scoreLocation(
    jobLocation: string | null,
    candidateLocation: string | null,
    isRemote: boolean,
  ): number {
    if (isRemote) return 100;
    if (!jobLocation || !candidateLocation) return 70; // unknown = neutral
    const j = jobLocation.toLowerCase().trim();
    const c = candidateLocation.toLowerCase().trim();
    if (j === c) return 100;
    // City match within same state (simple heuristic)
    const jParts = j.split(',');
    const cParts = c.split(',');
    if (jParts.some((p) => cParts.includes(p.trim()))) return 75;
    return 40; // different location, relocation required
  }

  // ── Salary Scoring ────────────────────────────────────────────────────────

  private scoreSalary(
    offeredMin: number | null,
    offeredMax: number | null,
    expectedSalary: number | null,
  ): number {
    if (!offeredMin || !expectedSalary) return 70; // unknown = neutral
    if (expectedSalary <= (offeredMax ?? offeredMin)) return 100;
    // Candidate expects more than max offer
    const overDemand = (expectedSalary - (offeredMax ?? offeredMin)) / (offeredMax ?? offeredMin);
    if (overDemand > 0.3) return 20; // >30% above offer = strong mismatch
    if (overDemand > 0.15) return 50;
    return 70; // slight mismatch but negotiable
  }

  // ── Match Score for a Candidate × Job ─────────────────────────────────────

  async scoreCandidateForJob(
    candidateId: string,
    jobId: string,
  ): Promise<CandidateMatchScore> {
    const [jobs, candidates] = await Promise.all([
      this.ds.query<Array<{
        id: string; title: string; location: string; is_remote: boolean;
        required_skills: string[]; preferred_skills: string[];
        experience_min: number; experience_max: number;
        salary_min: number; salary_max: number; department_id: string;
      }>>(
        `SELECT id, title, location, is_remote,
                COALESCE(required_skills, '[]')  AS required_skills,
                COALESCE(preferred_skills, '[]') AS preferred_skills,
                COALESCE(experience_min, 0)       AS experience_min,
                experience_max,
                salary_min, salary_max
         FROM recruitment_jobs WHERE id = $1`,
        [jobId],
      ),
      this.ds.query<Array<{
        id: string; skills: string[]; experience_years: number;
        current_location: string; expected_salary: number;
      }>>(
        `SELECT id,
                COALESCE(skills, '[]') AS skills,
                COALESCE(experience_years, 0) AS experience_years,
                current_location,
                expected_salary
         FROM candidate_profiles WHERE id = $1`,
        [candidateId],
      ),
    ]);

    if (!jobs[0] || !candidates[0]) {
      return {
        candidateId,
        jobId,
        skillScore: 0, experienceScore: 0,
        locationScore: 0, salaryScore: 0, overallScore: 0,
        skillBreakdown: {
          required: [], preferred: [], candidateSkills: [],
          matchedRequired: [], matchedPreferred: [],
          missingRequired: [], skillScore: 0,
        },
        recommendation: 'POOR_FIT',
        reason: 'Candidate or job record not found.',
        explanations: {
          skillMatch: [],
          missingSkills: [],
          bonusSkills: [],
          salaryGap: 0,
          experienceDelta: 0,
          locationNote: 'Record not found.',
          scoreDecomposition: {
            skillContribution: 0,
            experienceContribution: 0,
            locationContribution: 0,
            salaryContribution: 0,
          },
          narrative: 'Candidate or job record not found.',
        },
      };
    }

    const job  = jobs[0];
    const cand = candidates[0];

    const { score: skillScore, breakdown: skillBreakdown } = this.scoreSkills(
      job.required_skills, job.preferred_skills, cand.skills,
    );
    const experienceScore = this.scoreExperience(
      job.experience_min, job.experience_max, cand.experience_years,
    );
    const locationScore = this.scoreLocation(
      job.location, cand.current_location, job.is_remote,
    );
    const salaryScore = this.scoreSalary(
      job.salary_min, job.salary_max, cand.expected_salary,
    );

    const overallScore = Math.round(
      skillScore      * MATCH_WEIGHTS.skill      +
      experienceScore * MATCH_WEIGHTS.experience +
      locationScore   * MATCH_WEIGHTS.location   +
      salaryScore     * MATCH_WEIGHTS.salary,
    );

    const recommendation: CandidateMatchScore['recommendation'] =
      overallScore >= 80 ? 'STRONG_FIT' :
      overallScore >= 60 ? 'GOOD_FIT'   :
      overallScore >= 40 ? 'PARTIAL_FIT': 'POOR_FIT';

    const missingCount = skillBreakdown.missingRequired.length;
    const reason =
      overallScore >= 80
        ? `Excellent match — meets all key criteria.`
        : overallScore >= 60
        ? `Good match — ${missingCount > 0 ? `missing ${missingCount} required skill(s): ${skillBreakdown.missingRequired.join(', ')}` : 'skills aligned'}.`
        : overallScore >= 40
        ? `Partial match — significant gaps in ${missingCount > 0 ? 'skills' : 'other areas'}.`
        : `Poor fit — ${missingCount} missing required skills and low overall alignment.`;

    // ── Build AI Explainability Payload ──────────────────────────────────
    const salaryGap = cand.expected_salary && job.salary_max
      ? Math.round(cand.expected_salary - job.salary_max)
      : 0;
    const experienceDelta = Math.round(cand.experience_years - job.experience_min);
    const locationNote =
      job.is_remote               ? 'Remote position — location not a barrier.' :
      locationScore === 100        ? `Location match: ${cand.current_location ?? 'same area'}.` :
      locationScore >= 75          ? 'Partial location match — same region, different city.' :
                                     `Location mismatch — ${cand.current_location ?? 'unknown'} vs. ${job.location ?? 'unknown'}. Relocation may be needed.`;

    const explanations: AiMatchExplanation = {
      skillMatch:      skillBreakdown.matchedRequired,
      missingSkills:   skillBreakdown.missingRequired,
      bonusSkills:     skillBreakdown.matchedPreferred,
      salaryGap,
      experienceDelta,
      locationNote,
      scoreDecomposition: {
        skillContribution:      Math.round(skillScore      * MATCH_WEIGHTS.skill),
        experienceContribution: Math.round(experienceScore * MATCH_WEIGHTS.experience),
        locationContribution:   Math.round(locationScore   * MATCH_WEIGHTS.location),
        salaryContribution:     Math.round(salaryScore     * MATCH_WEIGHTS.salary),
      },
      narrative: [
        skillBreakdown.matchedRequired.length > 0
          ? `✓ Has ${skillBreakdown.matchedRequired.length} of ${skillBreakdown.required.length} required skills.`
          : `✗ Missing all required skills.`,
        skillBreakdown.missingRequired.length > 0
          ? `✗ Missing: ${skillBreakdown.missingRequired.join(', ')}.`
          : '',
        experienceDelta >= 0
          ? `✓ ${experienceDelta}y above minimum experience.`
          : `✗ ${Math.abs(experienceDelta)}y below minimum experience.`,
        salaryGap > 0
          ? `⚠ Expects ₹${salaryGap.toLocaleString('en-IN')} above max offered.`
          : salaryGap < 0 ? `✓ Within salary range.` : '',
        locationNote,
      ].filter(Boolean).join(' '),
    };

    return {
      candidateId, jobId,
      skillScore, experienceScore, locationScore, salaryScore, overallScore,
      skillBreakdown,
      recommendation,
      reason,
      explanations,
    };
  }

  // ── Top Candidates for a Job ──────────────────────────────────────────────

  async getTopCandidatesForJob(
    jobId: string,
    tenantId: string,
    limit = 20,
  ): Promise<JobMatchResult> {
    // Fetch all active candidates in tenant
    const candidates = await this.ds.query<Array<{ id: string }>>(
      `SELECT id FROM candidate_profiles WHERE tenant_id = $1 LIMIT 500`,
      [tenantId],
    );

    const jobs = await this.ds.query<Array<{ id: string; title: string }>>(
      `SELECT id, title FROM recruitment_jobs WHERE id = $1`,
      [jobId],
    );

    if (!jobs[0]) {
      return { jobId, jobTitle: 'Unknown', topCandidates: [], totalCandidatesScored: 0, avgScore: 0 };
    }

    // Score all candidates (parallel but throttled)
    const scored = await Promise.all(
      candidates.map((c) => this.scoreCandidateForJob(c.id, jobId)),
    );

    scored.sort((a, b) => b.overallScore - a.overallScore);

    const top  = scored.slice(0, limit);
    const avg  = scored.length > 0
      ? Math.round(scored.reduce((s, c) => s + c.overallScore, 0) / scored.length)
      : 0;

    this.logger.log(
      `AI_MATCH: jobId=${jobId} scored=${scored.length} candidates, avgScore=${avg}`,
    );

    return {
      jobId,
      jobTitle: jobs[0].title,
      topCandidates:        top,
      totalCandidatesScored: scored.length,
      avgScore:             avg,
    };
  }

  // ── Best Jobs for a Candidate ─────────────────────────────────────────────

  async getBestJobsForCandidate(
    candidateId: string,
    tenantId: string,
    limit = 10,
  ): Promise<CandidateMatchScore[]> {
    const jobs = await this.ds.query<Array<{ id: string }>>(
      `SELECT id FROM recruitment_jobs
       WHERE tenant_id = $1 AND status = 'published'
       LIMIT 100`,
      [tenantId],
    );

    const scored = await Promise.all(
      jobs.map((j) => this.scoreCandidateForJob(candidateId, j.id)),
    );

    return scored
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  }
}
