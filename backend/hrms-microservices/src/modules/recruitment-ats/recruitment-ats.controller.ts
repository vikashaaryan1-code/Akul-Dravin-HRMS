import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { RecruitmentAtsService } from './recruitment-ats.service';
import { AtsPipelineService, ApplicationStage } from './ats-pipeline.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PlanEnforcementGuard, RequireFeature } from '../subscription-billing/plan-enforcement.guard';
import { PlanFeature } from '../subscription-billing/plan-catalog';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

/**
 * RECRUITMENT ATS CONTROLLER
 *
 * REST surface for the full ATS pipeline (PRD §6–§8).
 *
 * Route map:
 *
 *   ── Jobs ─────────────────────────────────────────────────────────
 *   GET    /recruitment/jobs                  → list all jobs (tenant)
 *   POST   /recruitment/jobs                  → create job requisition
 *   PATCH  /recruitment/jobs/:id              → update job details
 *   PATCH  /recruitment/jobs/:id/publish      → publish job to portal
 *   PATCH  /recruitment/jobs/:id/close        → close job
 *
 *   ── Applications ──────────────────────────────────────────────────
 *   GET    /recruitment/applications          → list all applications
 *   GET    /recruitment/applications/:id      → single application
 *   POST   /recruitment/applications          → submit application (candidate)
 *
 *   ── Pipeline (Kanban) ─────────────────────────────────────────────
 *   GET    /recruitment/jobs/:id/kanban       → Kanban board per job
 *   GET    /recruitment/jobs/:id/metrics      → funnel metrics per job
 *   POST   /recruitment/applications/:id/move → advance stage
 *   POST   /recruitment/applications/:id/reject → reject
 *   POST   /recruitment/applications/:id/hire  → process hire
 *
 *   ── Interviews ────────────────────────────────────────────────────
 *   POST   /recruitment/applications/:id/interviews       → schedule
 *   POST   /recruitment/interviews/:id/complete           → complete + scorecard
 *
 *   ── Offers ────────────────────────────────────────────────────────
 *   POST   /recruitment/applications/:id/offer            → create offer
 *   POST   /recruitment/offers/:id/send                   → send to candidate
 *   POST   /recruitment/offers/:id/accept                 → candidate accepted
 */
import { ResumeParsingService } from './resume-parsing.service';

@Controller('recruitment')
@UseGuards(RolesGuard, PlanEnforcementGuard)
export class RecruitmentAtsController {
  constructor(
    private readonly atsService:      RecruitmentAtsService,
    private readonly pipelineService: AtsPipelineService,
    private readonly resumeParsing:   ResumeParsingService,
  ) {}

  @Post('applications/upload-resume')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  uploadResume(
    @Body() body: { tenantId: string; jobId: string; candidateId: string; fileName: string; fileContentBase64: string }
  ) {
    // In a real app we'd use FileInterceptor, but for JSON payload we simulate file buffer
    const buffer = Buffer.from(body.fileContentBase64 || '', 'base64');
    return this.resumeParsing.uploadAndParseResume(body.tenantId, body.jobId, body.candidateId, buffer, body.fileName);
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────

  @Get('jobs')
  findAllJobs() {
    return this.atsService.findAllJobs();
  }

  @Post('jobs')
  @HttpCode(HttpStatus.CREATED)
  @RequireFeature(PlanFeature.ATS_BASIC)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  createJob(@Body() body: Record<string, unknown>) {
    return this.atsService.createJob(body);
  }

  @Patch('jobs/:id')
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  updateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.atsService.updateJob(id, body);
  }

  @Patch('jobs/:id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  publishJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.atsService.updateJob(id, { status: 'open', isMarketplaceVisible: true });
  }

  @Patch('jobs/:id/close')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  closeJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.atsService.updateJob(id, { status: 'closed', isMarketplaceVisible: false });
  }

  // ── Kanban / Pipeline ─────────────────────────────────────────────────────

  @Get('jobs/:id/kanban')
  @RequireFeature(PlanFeature.ATS_PIPELINE)
  getKanban(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelineService.getKanbanBoard(id);
  }

  @Get('jobs/:id/metrics')
  @RequireFeature(PlanFeature.ATS_PIPELINE)
  getMetrics(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelineService.getPipelineMetrics(id);
  }

  // ── Applications ──────────────────────────────────────────────────────────

  @Get('applications')
  findAllApplications() {
    return this.atsService.findAllApplications();
  }

  @Get('applications/:id')
  findApplication(@Param('id', ParseUUIDPipe) id: string) {
    return this.atsService.findAllApplications().then(apps =>
      apps.find(a => a.id === id) ?? null,
    );
  }

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  createApplication(@Body() body: Record<string, unknown>) {
    return this.atsService.createApplication(body);
  }

  // ── Pipeline moves ────────────────────────────────────────────────────────

  @Post('applications/:id/move')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  moveStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { toStage: ApplicationStage; note?: string; actorId?: string; forceMove?: boolean },
  ) {
    return this.pipelineService.moveStage({
      applicationId: id,
      toStage:       body.toStage,
      note:          body.note,
      actorId:       body.actorId,
      forceMove:     body.forceMove,
    });
  }

  @Post('applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  rejectApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string; actorId?: string },
  ) {
    return this.pipelineService.rejectApplication(id, body.reason, body.actorId);
  }

  @Post('applications/:id/hire')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  processHire(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { actorId?: string },
  ) {
    return this.pipelineService.processHire(id, body.actorId);
  }

  // ── Interview management ──────────────────────────────────────────────────

  @Post('applications/:id/interviews')
  @HttpCode(HttpStatus.CREATED)
  @RequireFeature(PlanFeature.ATS_PIPELINE)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  scheduleInterview(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() body: {
      jobId:          string;
      candidateId:    string;
      roundNumber:    number;
      interviewType:  string;
      scheduledAt:    string;
      durationMinutes?: number;
      mode:           string;
      meetingLink?:   string;
      location?:      string;
      interviewerIds: string[];
      tenantId:       string;
      actorId?:       string;
    },
  ) {
    return this.pipelineService.scheduleInterview({ ...body, applicationId });
  }

  @Post('interviews/:id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  completeInterview(
    @Param('id', ParseUUIDPipe) interviewId: string,
    @Body() body: {
      tenantId:      string;
      overallRating: number;
      recommendation: 'proceed' | 'hold' | 'reject';
      scorecard:     Record<string, number>;
      feedback?:     string;
      actorId?:      string;
    },
  ) {
    const { tenantId, ...params } = body;
    return this.pipelineService.completeInterview(interviewId, tenantId, params);
  }

  // ── Offer management ──────────────────────────────────────────────────────

  @Post('applications/:id/offer')
  @HttpCode(HttpStatus.CREATED)
  @RequireFeature(PlanFeature.ATS_OFFERS)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  createOffer(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() body: {
      jobId:               string;
      candidateId:         string;
      offeredDesignation:  string;
      offeredCtc:          number;
      joiningDate:         string;
      offerExpiryDate?:    string;
      salaryBreakdown?:    Record<string, number>;
      benefits?:           string[];
      tenantId:            string;
      createdBy?:          string;
    },
  ) {
    return this.pipelineService.createOffer({ ...body, applicationId });
  }

  @Post('offers/:id/send')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  sendOffer(
    @Param('id', ParseUUIDPipe) offerId: string,
    @Body() body: { tenantId: string; actorId?: string },
  ) {
    return this.pipelineService.sendOffer(offerId, body.tenantId, body.actorId);
  }

  @Post('offers/:id/accept')
  @HttpCode(HttpStatus.OK)
  acceptOffer(
    @Param('id', ParseUUIDPipe) offerId: string,
    @Body() body: { tenantId: string },
  ) {
    return this.pipelineService.acceptOffer(offerId, body.tenantId);
  }
}
