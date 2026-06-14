import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { TenantContext } from '../../common/context/tenant-context';

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Stage Enum  (PRD §6.2.2 Recruiter Actions)
// ─────────────────────────────────────────────────────────────────────────────

export enum ApplicationStage {
  APPLIED              = 'applied',
  SCREENING            = 'screening',
  SHORTLISTED          = 'shortlisted',
  INTERVIEW_SCHEDULED  = 'interview_scheduled',
  INTERVIEW_COMPLETED  = 'interview_completed',
  OFFER_PENDING        = 'offer_pending',
  OFFER_SENT           = 'offer_sent',
  OFFER_ACCEPTED       = 'offer_accepted',
  HIRED                = 'hired',
  REJECTED             = 'rejected',
  WITHDRAWN            = 'withdrawn',
  ON_HOLD              = 'on_hold',
}

// Kanban column groupings for the dashboard
export const PIPELINE_COLUMNS: Record<string, ApplicationStage[]> = {
  'New':       [ApplicationStage.APPLIED],
  'Screening': [ApplicationStage.SCREENING],
  'Shortlist': [ApplicationStage.SHORTLISTED],
  'Interview': [ApplicationStage.INTERVIEW_SCHEDULED, ApplicationStage.INTERVIEW_COMPLETED],
  'Offer':     [ApplicationStage.OFFER_PENDING, ApplicationStage.OFFER_SENT, ApplicationStage.OFFER_ACCEPTED],
  'Closed':    [ApplicationStage.HIRED, ApplicationStage.REJECTED, ApplicationStage.WITHDRAWN],
};

// Legal forward-only transitions (prevents re-applying to an earlier stage without override)
const PIPELINE_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  [ApplicationStage.APPLIED]:             [ApplicationStage.SCREENING, ApplicationStage.SHORTLISTED, ApplicationStage.REJECTED, ApplicationStage.ON_HOLD],
  [ApplicationStage.SCREENING]:           [ApplicationStage.SHORTLISTED, ApplicationStage.REJECTED, ApplicationStage.ON_HOLD],
  [ApplicationStage.SHORTLISTED]:         [ApplicationStage.INTERVIEW_SCHEDULED, ApplicationStage.REJECTED, ApplicationStage.ON_HOLD],
  [ApplicationStage.INTERVIEW_SCHEDULED]: [ApplicationStage.INTERVIEW_COMPLETED, ApplicationStage.REJECTED, ApplicationStage.ON_HOLD],
  [ApplicationStage.INTERVIEW_COMPLETED]: [ApplicationStage.OFFER_PENDING, ApplicationStage.SHORTLISTED, ApplicationStage.REJECTED, ApplicationStage.ON_HOLD],
  [ApplicationStage.OFFER_PENDING]:       [ApplicationStage.OFFER_SENT, ApplicationStage.REJECTED],
  [ApplicationStage.OFFER_SENT]:          [ApplicationStage.OFFER_ACCEPTED, ApplicationStage.REJECTED, ApplicationStage.WITHDRAWN],
  [ApplicationStage.OFFER_ACCEPTED]:      [ApplicationStage.HIRED, ApplicationStage.WITHDRAWN],
  [ApplicationStage.HIRED]:              [],
  [ApplicationStage.REJECTED]:           [],
  [ApplicationStage.WITHDRAWN]:          [],
  [ApplicationStage.ON_HOLD]:            [ApplicationStage.SCREENING, ApplicationStage.SHORTLISTED, ApplicationStage.REJECTED],
};

// ─────────────────────────────────────────────────────────────────────────────
// DTOs / Result types
// ─────────────────────────────────────────────────────────────────────────────

export interface MoveStageParams {
  applicationId: string;
  toStage:       ApplicationStage;
  actorId?:      string;
  note?:         string;
  rejectionReason?: string;
  interviewId?:  string;
  offerId?:      string;
  forceMove?:    boolean;   // override transition guard (admin override)
}

export interface ScheduleInterviewParams {
  applicationId: string;
  jobId:         string;
  candidateId:   string;
  roundNumber:   number;
  interviewType: string;   // technical, hr, cultural, panel
  scheduledAt:   string;   // ISO timestamp
  durationMinutes?: number;
  mode:          string;   // video, in_person, phone
  meetingLink?:  string;
  location?:     string;
  interviewerIds: string[];
  tenantId:      string;
  actorId?:      string;
}

export interface ScheduleInterviewResult {
  interviewId:    string;
  applicationId:  string;
  scheduledAt:    string;
  calendarInvites: string[];
}

export interface CreateOfferParams {
  applicationId:        string;
  jobId:                string;
  candidateId:          string;
  offeredDesignation:   string;
  offeredCtc:           number;
  joiningDate:          string;
  offerExpiryDate?:     string;
  salaryBreakdown?:     Record<string, number>;
  benefits?:            string[];
  tenantId:             string;
  createdBy?:           string;
}

export interface KanbanBoard {
  jobId:    string;
  jobTitle: string;
  columns:  KanbanColumn[];
  metrics:  PipelineMetrics;
}

export interface KanbanColumn {
  key:          string;
  label:        string;
  count:        number;
  applications: ApplicationCard[];
}

export interface ApplicationCard {
  id:            string;
  candidateId:   string;
  candidateName?: string;
  stage:         string;
  score?:        number;
  aiScore?:      number;
  daysSinceApplied: number;
  source:        string;
}

export interface PipelineMetrics {
  total:       number;
  active:      number;
  hired:        number;
  rejected:    number;
  conversionRate: number;
  avgDaysToHire:  number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ATS PIPELINE SERVICE
 *
 * Implements PRD §6.2.2 full ATS pipeline:
 *   Job Posted → AI Database Scan → Smart Shortlisting → Recruiter Notification
 *   → Auto-Scheduling → Interview Analysis → Offer Generation → Onboarding Trigger
 *
 * Core operations:
 *   moveStage            — validated Kanban stage transition
 *   scheduleInterview    — create interview + auto-advance stage
 *   completeInterview    — record scorecard + auto-advance
 *   createOffer          — formal offer record + auto-advance to OFFER_PENDING
 *   sendOffer            — mark offer as sent + auto-advance to OFFER_SENT
 *   acceptOffer          — candidate accepts → OFFER_ACCEPTED
 *   processHire          — HIRED + increment job.hired_count + trigger onboarding
 *   rejectApplication    — REJECTED at any stage
 *   getKanbanBoard       — per-job Kanban board with metrics
 *   getPipelineMetrics   — aggregated funnel metrics
 */
@Injectable()
export class AtsPipelineService {
  private readonly logger = new Logger(AtsPipelineService.name);

  constructor(private readonly dataSource: DataSource) {}

  // ── Repo accessors ────────────────────────────────────────────────────────

  private get appRepo() {
    return TenantContext.getRepository(RecruitmentApplicationEntity);
  }

  private get jobRepo() {
    return TenantContext.getRepository(RecruitmentJobEntity);
  }

  // ── 1. Stage Transition (Kanban Move) ────────────────────────────────────

  /**
   * Move an application from one pipeline stage to the next.
   * Validates against PIPELINE_TRANSITIONS unless forceMove=true (admin).
   * Appends an immutable event to pipeline_history JSONB.
   */
  async moveStage(params: MoveStageParams): Promise<RecruitmentApplicationEntity> {
    const application = await this.appRepo.findOne({ where: { id: params.applicationId } });
    if (!application) {
      throw new NotFoundException(`Application ${params.applicationId} not found`);
    }

    const current = application.stage as ApplicationStage;
    const target  = params.toStage;

    if (!params.forceMove) {
      const allowed = PIPELINE_TRANSITIONS[current] ?? [];
      if (!allowed.includes(target)) {
        throw new BadRequestException(
          `Invalid pipeline transition: ${current} → ${target}. ` +
          `Allowed: [${allowed.join(', ')}]`,
        );
      }
    }

    // Update fields
    application.stage  = target;
    application.status = this.stageToStatus(target);

    const app = application as unknown as Record<string, unknown>;

    // Update rejection reason if rejecting
    if (target === ApplicationStage.REJECTED && params.rejectionReason) {
      app['rejectionReason'] = params.rejectionReason;
      app['rejectionStage']  = current;
    }
    if (target === ApplicationStage.HIRED) {
      app['hiredAt'] = new Date().toISOString();
    }
    if (target === ApplicationStage.WITHDRAWN) {
      app['withdrawnAt'] = new Date().toISOString();
    }
    app['lastStageChangedAt'] = new Date().toISOString();

    // Append to pipeline_history
    const history = this.getHistory(application);
    history.push({
      from:       current,
      to:         target,
      actor:      params.actorId,
      note:       params.note,
      interviewId: params.interviewId,
      offerId:    params.offerId,
      timestamp:  new Date().toISOString(),
    });
    app['pipelineHistory'] = history;

    const saved = await this.appRepo.save(application);

    // If HIRED, increment job hired_count
    if (target === ApplicationStage.HIRED) {
      await this.jobRepo.increment({ id: application.jobId }, 'hiredCount', 1).catch(() => {
        this.logger.warn(`Could not increment hiredCount on job ${application.jobId}`);
      });
    }

    this.logger.log(
      `[ATS] Application ${params.applicationId}: ${current} → ${target}` +
      (params.actorId ? ` by ${params.actorId}` : ''),
    );

    return saved;
  }

  // ── 2. Schedule Interview ─────────────────────────────────────────────────

  /**
   * Create an interview record and advance application to INTERVIEW_SCHEDULED.
   * PRD §3.2.5: Auto-Scheduling step in the AI Hiring Automation Workflow.
   */
  async scheduleInterview(params: ScheduleInterviewParams): Promise<ScheduleInterviewResult> {
    const interviewId = crypto.randomUUID();

    await this.dataSource.query(`
      INSERT INTO recruitment_interviews (
        id, tenant_id, application_id, job_id, candidate_id,
        round_number, interview_type, scheduled_at, duration_minutes,
        mode, meeting_link, location, interviewer_ids, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'scheduled'
      )
    `, [
      interviewId,
      params.tenantId,
      params.applicationId,
      params.jobId,
      params.candidateId,
      params.roundNumber,
      params.interviewType,
      params.scheduledAt,
      params.durationMinutes ?? 60,
      params.mode,
      params.meetingLink  ?? null,
      params.location     ?? null,
      JSON.stringify(params.interviewerIds),
    ]);

    // Advance pipeline stage
    await this.moveStage({
      applicationId: params.applicationId,
      toStage:       ApplicationStage.INTERVIEW_SCHEDULED,
      actorId:       params.actorId,
      note:          `Round ${params.roundNumber} ${params.interviewType} scheduled`,
      interviewId,
    });

    this.logger.log(
      `[ATS] Interview ${interviewId} scheduled for app=${params.applicationId} ` +
      `at ${params.scheduledAt}`,
    );

    return {
      interviewId,
      applicationId: params.applicationId,
      scheduledAt:   params.scheduledAt,
      calendarInvites: params.interviewerIds,  // downstream scheduler sends invites
    };
  }

  // ── 3. Complete Interview ─────────────────────────────────────────────────

  async completeInterview(
    interviewId: string,
    tenantId: string,
    params: {
      overallRating:   number;      // 1–5
      recommendation:  'proceed' | 'hold' | 'reject';
      scorecard:       Record<string, number>;
      feedback?:       string;
      actorId?:        string;
    },
  ): Promise<void> {
    const [interview] = await this.dataSource.query(
      `SELECT * FROM recruitment_interviews WHERE id = $1 AND tenant_id = $2`,
      [interviewId, tenantId],
    );

    if (!interview) throw new NotFoundException(`Interview ${interviewId} not found`);

    await this.dataSource.query(`
      UPDATE recruitment_interviews SET
        status = 'completed',
        overall_rating = $1,
        recommendation = $2,
        scorecard = $3,
        feedback = $4,
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $5
    `, [
      params.overallRating,
      params.recommendation,
      JSON.stringify(params.scorecard),
      params.feedback ?? null,
      interviewId,
    ]);

    // Auto-advance application stage
    await this.moveStage({
      applicationId: interview.application_id,
      toStage:       ApplicationStage.INTERVIEW_COMPLETED,
      actorId:       params.actorId,
      note:          `Interview completed — rating: ${params.overallRating}/5, recommend: ${params.recommendation}`,
      interviewId,
    });

    this.logger.log(`[ATS] Interview ${interviewId} completed (${params.recommendation})`);
  }

  // ── 4. Create Offer ───────────────────────────────────────────────────────

  async createOffer(params: CreateOfferParams): Promise<string> {
    const offerId   = crypto.randomUUID();
    const offerCode = `OFR-${Date.now().toString(36).toUpperCase()}`;

    await this.dataSource.query(`
      INSERT INTO recruitment_offers (
        id, tenant_id, application_id, job_id, candidate_id,
        offer_code, offered_designation, offered_ctc, joining_date,
        offer_expiry_date, salary_breakdown, benefits, status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', $13
      )
    `, [
      offerId,
      params.tenantId,
      params.applicationId,
      params.jobId,
      params.candidateId,
      offerCode,
      params.offeredDesignation,
      params.offeredCtc,
      params.joiningDate,
      params.offerExpiryDate ?? null,
      JSON.stringify(params.salaryBreakdown ?? {}),
      JSON.stringify(params.benefits ?? []),
      params.createdBy ?? null,
    ]);

    // Advance pipeline to OFFER_PENDING
    await this.moveStage({
      applicationId: params.applicationId,
      toStage:       ApplicationStage.OFFER_PENDING,
      offerId,
      note:          `Offer created: ${offerCode}`,
    });

    this.logger.log(`[ATS] Offer ${offerId} (${offerCode}) created for app=${params.applicationId}`);
    return offerId;
  }

  // ── 5. Send Offer ─────────────────────────────────────────────────────────

  async sendOffer(offerId: string, tenantId: string, actorId?: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE recruitment_offers SET status='sent', sent_at=NOW(), updated_at=NOW()
       WHERE id=$1 AND tenant_id=$2`,
      [offerId, tenantId],
    );

    const [offer] = await this.dataSource.query(
      `SELECT application_id FROM recruitment_offers WHERE id=$1`,
      [offerId],
    );
    if (offer) {
      await this.moveStage({
        applicationId: offer.application_id,
        toStage:       ApplicationStage.OFFER_SENT,
        actorId,
        offerId,
        note:          'Offer letter sent to candidate',
      });
    }

    this.logger.log(`[ATS] Offer ${offerId} sent`);
  }

  // ── 6. Accept / Reject Offer ──────────────────────────────────────────────

  async acceptOffer(offerId: string, tenantId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE recruitment_offers SET status='accepted', accepted_at=NOW(), updated_at=NOW()
       WHERE id=$1 AND tenant_id=$2`,
      [offerId, tenantId],
    );

    const [offer] = await this.dataSource.query(
      `SELECT application_id FROM recruitment_offers WHERE id=$1`,
      [offerId],
    );
    if (offer) {
      await this.moveStage({
        applicationId: offer.application_id,
        toStage:       ApplicationStage.OFFER_ACCEPTED,
        offerId,
        note:          'Offer accepted by candidate',
      });
    }
  }

  // ── 7. Process Hire ───────────────────────────────────────────────────────

  /**
   * Mark as HIRED.
   * PRD §3.2.5 Step 8: triggers onboarding event.
   * Caller should fire domain event / create employee lifecycle ONBOARDING.
   */
  async processHire(
    applicationId: string,
    actorId?: string,
  ): Promise<RecruitmentApplicationEntity> {
    return this.moveStage({
      applicationId,
      toStage: ApplicationStage.HIRED,
      actorId,
      note:    'Candidate officially hired — onboarding initiated',
    });
  }

  // ── 8. Reject Application ─────────────────────────────────────────────────

  async rejectApplication(
    applicationId: string,
    reason: string,
    actorId?: string,
  ): Promise<RecruitmentApplicationEntity> {
    return this.moveStage({
      applicationId,
      toStage:          ApplicationStage.REJECTED,
      actorId,
      rejectionReason:  reason,
      note:             `Rejected: ${reason}`,
    });
  }

  // ── 9. Kanban Board ───────────────────────────────────────────────────────

  /**
   * Return Kanban board data for a job — grouped by pipeline columns.
   */
  async getKanbanBoard(jobId: string): Promise<KanbanBoard> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const applications = await this.appRepo.find({
      where: { jobId },
      order: { createdAt: 'DESC' },
    });

    const now = Date.now();
    const columns: KanbanColumn[] = Object.entries(PIPELINE_COLUMNS).map(([key, stages]) => {
      const apps = applications.filter(a => stages.includes(a.stage as ApplicationStage));
      return {
        key,
        label: key,
        count: apps.length,
        applications: apps.map(a => ({
          id:               a.id,
          candidateId:      a.candidateId,
          stage:            a.stage,
          score:            a.score ? parseFloat(a.score as string) : undefined,
          aiScore:          (a as unknown as Record<string, unknown>)['aiScore'] as number | undefined,
          daysSinceApplied: Math.floor((now - new Date(a.createdAt).getTime()) / 86_400_000),
          source:           a.source,
        })),
      };
    });

    const metrics = this.calculateMetrics(applications);

    return { jobId, jobTitle: job.title, columns, metrics };
  }

  // ── 10. Pipeline Metrics ──────────────────────────────────────────────────

  async getPipelineMetrics(jobId: string): Promise<PipelineMetrics> {
    const applications = await this.appRepo.find({ where: { jobId } });
    return this.calculateMetrics(applications);
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private stageToStatus(stage: ApplicationStage): string {
    if ([ApplicationStage.HIRED].includes(stage))                    return 'hired';
    if ([ApplicationStage.REJECTED, ApplicationStage.WITHDRAWN].includes(stage)) return 'inactive';
    return 'active';
  }

  private getHistory(application: RecruitmentApplicationEntity): Record<string, unknown>[] {
    const raw = (application as unknown as Record<string, unknown>)['pipelineHistory'];
    return Array.isArray(raw) ? raw as Record<string, unknown>[] : [];
  }

  private calculateMetrics(applications: RecruitmentApplicationEntity[]): PipelineMetrics {
    const total    = applications.length;
    const hired    = applications.filter(a => a.stage === ApplicationStage.HIRED).length;
    const rejected = applications.filter(a => a.stage === ApplicationStage.REJECTED).length;
    const active   = total - hired - rejected - applications.filter(a => a.stage === ApplicationStage.WITHDRAWN).length;

    const hiredApps  = applications.filter(a => {
      const app = a as unknown as Record<string, unknown>;
      return a.stage === ApplicationStage.HIRED && app['hiredAt'];
    });

    let avgDaysToHire: number | null = null;
    if (hiredApps.length > 0) {
      const totalDays = hiredApps.reduce((sum, a) => {
        const app = a as unknown as Record<string, unknown>;
        const hiredAt = new Date(app['hiredAt'] as string).getTime();
        const appliedAt = new Date(a.createdAt).getTime();
        return sum + Math.floor((hiredAt - appliedAt) / 86_400_000);
      }, 0);
      avgDaysToHire = Math.round(totalDays / hiredApps.length);
    }

    return {
      total,
      active,
      hired,
      rejected,
      conversionRate: total > 0 ? Math.round((hired / total) * 100 * 10) / 10 : 0,
      avgDaysToHire,
    };
  }
}
