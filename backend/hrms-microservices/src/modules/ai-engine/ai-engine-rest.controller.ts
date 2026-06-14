import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { TenantContext } from '../../common/context/tenant-context';

// 8-Layer AI Services
import { AiHrCoreService } from './layers/ai-hr-core.service';
import { AiRecruitmentEngineService } from './layers/ai-recruitment-engine.service';
import { AiTalentIntelligenceService } from './layers/ai-talent-intelligence.service';
import { AiWorkforceAnalyticsService } from './layers/ai-workforce-analytics.service';
import { AiDecisionEngineService } from './layers/ai-decision-engine.service';
import { AiSecurityEngineService } from './layers/ai-security-engine.service';
import { AiVoiceTextAssistantService } from './layers/ai-voice-text-assistant.service';
import { AiAutomationEngineService } from './layers/ai-automation-engine.service';

/**
 * AI ENGINE REST CONTROLLER - 8 SPECIALIZED LAYERS
 *
 * Exposes all AI capabilities via a unified, secure REST API.
 * All endpoints are tenant-scoped and role-protected.
 *
 * Base Path: /api/v1/ai
 */
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiEngineRestController {
  private readonly logger = new Logger(AiEngineRestController.name);

  constructor(
    private readonly hrCore: AiHrCoreService,
    private readonly recruitment: AiRecruitmentEngineService,
    private readonly talent: AiTalentIntelligenceService,
    private readonly workforce: AiWorkforceAnalyticsService,
    private readonly decision: AiDecisionEngineService,
    private readonly security: AiSecurityEngineService,
    private readonly assistant: AiVoiceTextAssistantService,
    private readonly automation: AiAutomationEngineService,
  ) {}

  // ===== LAYER 1: AI HR CORE =====

  /**
   * POST /ai/hr-core/analyze-leave
   * Analyze leave request and generate approval recommendation
   */
  @Post('hr-core/analyze-leave')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async analyzeLeave(@Body('leaveRequestId', ParseUUIDPipe) leaveRequestId: string) {
    const tenantId = TenantContext.getRequiredTenantId();
    this.logger.log(`[HR CORE] Analyzing leave ${leaveRequestId} for tenant ${tenantId}`);

    return await this.hrCore.analyzeLeaveRequest(leaveRequestId);
  }

  /**
   * POST /ai/hr-core/onboarding-plan
   * Generate comprehensive onboarding plan for new employee
   */
  @Post('hr-core/onboarding-plan')
  @Roles(Role.HR_MANAGER, (Role as any).ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateOnboardingPlan(@Body('employeeId', ParseUUIDPipe) employeeId: string) {
    const tenantId = TenantContext.getRequiredTenantId();
    this.logger.log(`[HR CORE] Generating onboarding plan for employee ${employeeId}`);

    return await this.hrCore.generateOnboardingPlan(employeeId);
  }

  /**
   * GET /ai/hr-core/leave-abuse-patterns/:employeeId
   * Detect leave abuse patterns and generate alert
   */
  @Get('hr-core/leave-abuse-patterns/:employeeId')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async detectLeaveAbusePatterns(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return await this.hrCore.detectLeaveAbusePatterns(employeeId);
  }

  /**
   * GET /ai/hr-core/promotion/:employeeId
   * Get AI-powered promotion recommendations
   */
  @Get('hr-core/promotion/:employeeId')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPromotionRecommendations(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return await this.hrCore.getPromotionRecommendations(employeeId);
  }

  // ===== LAYER 2: AI RECRUITMENT ENGINE =====

  /**
   * POST /ai/recruitment/generate-job-description
   * Generate professional job description from parameters
   */
  @Post('recruitment/generate-job-description')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateJobDescription(
    @Body() body: { jobTitle: string; department: string; level: string; responsibilities: string[] },
  ) {
    if (!body.jobTitle || !body.department) {
      throw new BadRequestException('jobTitle and department are required');
    }

    return await this.recruitment.generateJobDescription(
      body.jobTitle,
      body.department,
      body.level || 'Mid-Level',
      body.responsibilities || [],
    );
  }

  /**
   * POST /ai/recruitment/parse-resume
   * Parse and extract structured data from resume text
   */
  @Post('recruitment/parse-resume')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async parseResume(@Body('resumeText') resumeText: string) {
    if (!resumeText) {
      throw new BadRequestException('resumeText is required');
    }

    return await this.recruitment.parseResume(resumeText);
  }

  /**
   * POST /ai/recruitment/screen-candidate
   * AI screen candidate against job requirements
   */
  @Post('recruitment/screen-candidate')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async screenCandidate(@Body('applicationId', ParseUUIDPipe) applicationId: string) {
    return await this.recruitment.screenCandidate(applicationId);
  }

  /**
   * POST /ai/recruitment/interview-questions
   * Generate tailored interview questions
   */
  @Post('recruitment/interview-questions')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateInterviewQuestions(
    @Body() body: { jobTitle: string; department: string; seniority: string },
  ) {
    return await this.recruitment.generateInterviewQuestions(
      body.jobTitle,
      body.department,
      body.seniority,
    );
  }

  // ===== LAYER 3: AI TALENT INTELLIGENCE =====

  /**
   * POST /ai/talent/match-score
   * Calculate comprehensive talent match score (multidimensional)
   */
  @Post('talent/match-score')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async calculateTalentScore(
    @Body()
    body: {
      candidateId: string;
      jobId: string;
      weights?: { skillWeight?: number; experienceWeight?: number; locationWeight?: number; salaryWeight?: number; cultureWeight?: number };
    },
  ) {
    if (!body.candidateId || !body.jobId) {
      throw new BadRequestException('candidateId and jobId are required');
    }

    return await this.talent.calculateTalentScore(body.candidateId, body.jobId, body.weights);
  }

  /**
   * POST /ai/talent/skill-matrix
   * Map candidate skills to role requirements
   */
  @Post('talent/skill-matrix')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async mapSkillMatrix(@Body() body: { candidateId: string; requiredSkills: string[] }) {
    if (!body.candidateId || !body.requiredSkills?.length) {
      throw new BadRequestException('candidateId and requiredSkills are required');
    }

    return await this.talent.mapSkillMatrix(body.candidateId, body.requiredSkills);
  }

  // ===== LAYER 4: AI WORKFORCE ANALYTICS =====

  /**
   * GET /ai/workforce/attrition-risk/:employeeId
   * Predict employee attrition risk
   */
  @Get('workforce/attrition-risk/:employeeId')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async predictAttritionRisk(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return await this.workforce.predictAttritionRisk(employeeId);
  }

  /**
   * GET /ai/workforce/skill-gaps
   * Forecast organizational skill gaps
   */
  @Get('workforce/skill-gaps')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async forecastSkillGaps() {
    return await this.workforce.forecastSkillGaps();
  }

  /**
   * POST /ai/workforce/succession-plan/:roleId
   * Generate succession plan for critical roles
   */
  @Post('workforce/succession-plan/:roleId')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateSuccessionPlan(@Param('roleId') roleId: string) {
    return await this.workforce.generateSuccessionPlan(roleId);
  }

  // ===== LAYER 5: AI DECISION ENGINE =====

  /**
   * POST /ai/decision/training-plan/:employeeId
   * Generate personalized training plan
   */
  @Post('decision/training-plan/:employeeId')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateTrainingPlan(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body('targetRole') targetRole?: string,
  ) {
    return await this.decision.generateTrainingPlan(employeeId, targetRole);
  }

  /**
   * GET /ai/decision/talent-redistribution
   * Recommend organizational talent redistribution
   */
  @Get('decision/talent-redistribution')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async recommendTalentRedistribution() {
    return await this.decision.recommendTalentRedistribution();
  }

  /**
   * GET /ai/decision/compensation-recommendations
   * Get compensation adjustment recommendations
   */
  @Get('decision/compensation-recommendations')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async recommendCompensationAdjustments() {
    return await this.decision.recommendCompensationAdjustments();
  }

  // ===== LAYER 6: AI SECURITY ENGINE =====

  /**
   * GET /ai/security/behavioral-anomalies/:userId
   * Detect suspicious behavioral patterns
   */
  @Get('security/behavioral-anomalies/:userId')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async detectBehavioralAnomalies(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.security.detectBehavioralAnomalies(userId);
  }

  /**
   * GET /ai/security/ip-anomalies/:userId
   * Detect geographic/IP anomalies
   */
  @Get('security/ip-anomalies/:userId')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async detectIpAnomalies(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.security.detectIpAnomalies(userId);
  }

  /**
   * GET /ai/security/payroll-anomalies
   * Detect payroll discrepancies and violations
   */
  @Get('security/payroll-anomalies')
  @Roles(Role.SUPER_ADMIN, (Role as any).FINANCE_HEAD)
  @HttpCode(HttpStatus.OK)
  async detectPayrollAnomalies() {
    return await this.security.detectPayrollAnomalies();
  }

  /**
   * GET /ai/security/access-violations
   * Detect access control violations
   */
  @Get('security/access-violations')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async detectAccessViolations() {
    return await this.security.detectAccessViolations();
  }

  // ===== LAYER 7: AI VOICE & TEXT ASSISTANT =====

  /**
   * POST /ai/assistant/query
   * Handle employee Q&A queries
   */
  @Post('assistant/query')
  @HttpCode(HttpStatus.OK)
  async handleEmployeeQuery(
    @Body() body: { query: string; context?: { employeeId?: string; department?: string; role?: string } },
  ) {
    if (!body.query) {
      throw new BadRequestException('query is required');
    }

    return await this.assistant.handleEmployeeQuery(body.query, body.context);
  }

  /**
   * POST /ai/assistant/explain-payslip
   * Explain payroll breakdown to employee
   */
  @Post('assistant/explain-payslip')
  @HttpCode(HttpStatus.OK)
  async explainPayslip(
    @Body() body: { baseSalary: number; deductions: Record<string, number>; allowances: Record<string, number> },
  ) {
    return await this.assistant.explainPayslip(body.baseSalary, body.deductions, body.allowances);
  }

  /**
   * POST /ai/assistant/leave-policy
   * Answer leave policy questions
   */
  @Post('assistant/leave-policy')
  @HttpCode(HttpStatus.OK)
  async answerLeavePolicy(@Body('question') question: string) {
    if (!question) {
      throw new BadRequestException('question is required');
    }

    return await this.assistant.answerLeavePolicy(question);
  }

  /**
   * POST /ai/assistant/onboarding-guidance
   * Generate personalized onboarding guidance
   */
  @Post('assistant/onboarding-guidance')
  @Roles(Role.EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  async generateOnboardingGuidance(
    @Body() body: { role: string; department: string; startDate: string },
  ) {
    return await this.assistant.generateOnboardingGuidance(body.role, body.department, body.startDate);
  }

  // ===== LAYER 8: AI AUTOMATION ENGINE =====

  /**
   * POST /ai/automation/generate-offer-letter
   * Generate professional offer letter
   */
  @Post('automation/generate-offer-letter')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateOfferLetter(
    @Body() body: { candidateId: string; jobId: string; salary: number; joiningDate: string },
  ) {
    return await this.automation.generateOfferLetter(
      body.candidateId,
      body.jobId,
      body.salary,
      body.joiningDate,
    );
  }

  /**
   * POST /ai/automation/generate-promotion-letter
   * Generate promotion letter
   */
  @Post('automation/generate-promotion-letter')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async generatePromotionLetter(
    @Body() body: { employeeId: string; newDesignation: string; newSalary: number; effectiveDate: string },
  ) {
    return await this.automation.generatePromotionLetter(
      body.employeeId,
      body.newDesignation,
      body.newSalary,
      body.effectiveDate,
    );
  }

  /**
   * POST /ai/automation/generate-confirmation-letter
   * Generate confirmation letter (end of probation)
   */
  @Post('automation/generate-confirmation-letter')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateConfirmationLetter(@Body('employeeId', ParseUUIDPipe) employeeId: string) {
    return await this.automation.generateConfirmationLetter(employeeId);
  }

  /**
   * POST /ai/automation/generate-relieving-letter
   * Generate relieving letter (for exit)
   */
  @Post('automation/generate-relieving-letter')
  @Roles(Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateRelievingLetter(
    @Body() body: { employeeId: string; lastWorkingDay: string; reasonForExit?: string },
  ) {
    return await this.automation.generateRelievingLetter(
      body.employeeId,
      body.lastWorkingDay,
      body.reasonForExit,
    );
  }

  /**
   * POST /ai/automation/sign-document
   * Sign a document (e-signature)
   */
  @Post('automation/sign-document/:documentId')
  @Roles(Role.EMPLOYEE, Role.HR_MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async signDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() body: { signedBy: string; signedAt: string; signatureUrl?: string },
  ) {
    return await this.automation.signDocument(documentId, body);
  }
}
