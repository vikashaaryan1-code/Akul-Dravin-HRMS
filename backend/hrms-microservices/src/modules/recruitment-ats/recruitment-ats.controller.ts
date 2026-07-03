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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecruitmentAtsService } from './recruitment-ats.service';
import { AtsPipelineService } from './ats-pipeline.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PlanEnforcementGuard, RequireFeature } from '../subscription-billing/plan-enforcement.guard';
import { PlanFeature } from '../subscription-billing/plan-catalog';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ResumeParsingService } from './resume-parsing.service';
import { TenantContext } from '../../common/context/tenant-context';
import {
  UploadResumeDto,
  CreateJobDto,
  CreateApplicationDto,
  MoveStageDto,
  RejectApplicationDto,
  HireApplicationDto,
  ScheduleInterviewDto,
  CompleteInterviewDto,
  CreateOfferDto,
  OfferActionDto
} from './dto/recruitment-ats.dto';

@ApiTags('Recruitment ATS')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Upload and parse resume' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resume successfully uploaded and parsed' })
  uploadResume(@Body() body: UploadResumeDto) {
    const tenantId = TenantContext.getRequiredTenantId();
    const buffer = Buffer.from(body.fileContentBase64 || '', 'base64');
    return this.resumeParsing.uploadAndParseResume(tenantId, body.jobId, body.candidateId, buffer, body.fileName);
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────

  @Get('jobs')
  @ApiOperation({ summary: 'Find all ATS jobs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of all jobs returned successfully' })
  findAllJobs() {
    return this.atsService.findAllJobs();
  }

  @Post('jobs')
  @HttpCode(HttpStatus.CREATED)
  @RequireFeature(PlanFeature.ATS_BASIC)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create a new ATS job' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Job created successfully' })
  createJob(@Body() body: CreateJobDto) {
    return this.atsService.createJob(body);
  }

  @Patch('jobs/:id')
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update an existing ATS job' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job updated successfully' })
  updateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<CreateJobDto>,
  ) {
    return this.atsService.updateJob(id, body);
  }

  @Patch('jobs/:id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Publish a job to marketplace' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job published successfully' })
  publishJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.atsService.updateJob(id, { status: 'open', isMarketplaceVisible: true });
  }

  @Patch('jobs/:id/close')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Close a job' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job closed successfully' })
  closeJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.atsService.updateJob(id, { status: 'closed', isMarketplaceVisible: false });
  }

  // ── Kanban / Pipeline ─────────────────────────────────────────────────────

  @Get('jobs/:id/kanban')
  @RequireFeature(PlanFeature.ATS_PIPELINE)
  @ApiOperation({ summary: 'Get Kanban board for a job' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Kanban board retrieved successfully' })
  getKanban(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelineService.getKanbanBoard(id);
  }

  @Get('jobs/:id/metrics')
  @RequireFeature(PlanFeature.ATS_PIPELINE)
  @ApiOperation({ summary: 'Get pipeline metrics for a job' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pipeline metrics retrieved successfully' })
  getMetrics(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelineService.getPipelineMetrics(id);
  }

  // ── Applications ──────────────────────────────────────────────────────────

  @Get('applications')
  @ApiOperation({ summary: 'Find all applications' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of all applications returned successfully' })
  findAllApplications() {
    return this.atsService.findAllApplications();
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Find a specific application' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application returned successfully' })
  findApplication(@Param('id', ParseUUIDPipe) id: string) {
    return this.atsService.findAllApplications().then(apps =>
      apps.find(a => a.id === id) ?? null,
    );
  }

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit an application' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Application submitted successfully' })
  createApplication(@Body() body: CreateApplicationDto) {
    return this.atsService.createApplication(body);
  }

  // ── Pipeline moves ────────────────────────────────────────────────────────

  @Post('applications/:id/move')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Move application to another stage' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application moved successfully' })
  moveStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MoveStageDto,
  ) {
    return this.pipelineService.moveStage({
      applicationId: id,
      ...body
    });
  }

  @Post('applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Reject an application' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application rejected successfully' })
  rejectApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectApplicationDto,
  ) {
    return this.pipelineService.rejectApplication(id, body.reason, body.actorId);
  }

  @Post('applications/:id/hire')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Process hire for an application' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application marked as hired' })
  processHire(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: HireApplicationDto,
  ) {
    return this.pipelineService.processHire(id, body.actorId);
  }

  // ── Interview management ──────────────────────────────────────────────────

  @Post('applications/:id/interviews')
  @HttpCode(HttpStatus.CREATED)
  @RequireFeature(PlanFeature.ATS_PIPELINE)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Schedule an interview' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Interview scheduled successfully' })
  scheduleInterview(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() body: ScheduleInterviewDto,
  ) {
    return this.pipelineService.scheduleInterview({ ...body, applicationId });
  }

  @Post('interviews/:id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Complete an interview' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Interview completed successfully' })
  completeInterview(
    @Param('id', ParseUUIDPipe) interviewId: string,
    @Body() body: CompleteInterviewDto,
  ) {
    return this.pipelineService.completeInterview(interviewId, body);
  }

  // ── Offer management ──────────────────────────────────────────────────────

  @Post('applications/:id/offer')
  @HttpCode(HttpStatus.CREATED)
  @RequireFeature(PlanFeature.ATS_OFFERS)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create an offer for a candidate' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Offer created successfully' })
  createOffer(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() body: CreateOfferDto,
  ) {
    return this.pipelineService.createOffer({ ...body, applicationId });
  }

  @Post('offers/:id/send')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN, Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Send offer to candidate' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Offer sent successfully' })
  sendOffer(
    @Param('id', ParseUUIDPipe) offerId: string,
    @Body() body: OfferActionDto,
  ) {
    return this.pipelineService.sendOffer(offerId, body.actorId);
  }

  @Post('offers/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an offer' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Offer accepted successfully' })
  acceptOffer(
    @Param('id', ParseUUIDPipe) offerId: string,
  ) {
    return this.pipelineService.acceptOffer(offerId);
  }
}
