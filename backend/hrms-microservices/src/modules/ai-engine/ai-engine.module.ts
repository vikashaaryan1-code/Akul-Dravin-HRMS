import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiEngineController } from './ai-engine.controller';
import { AiEngineRestController } from './ai-engine-rest.controller';
import { ForensicAdvisoryController } from './forensic-advisory.controller';
import { AiEngineService } from './ai-engine.service';
import { ForensicAdvisoryService } from './forensic-advisory.service';
import { AiProviderService } from './ai-provider.service';
import { AiMatchingService } from './ai-matching.service';
import { AiWorkforcePlanningService } from './ai-workforce-planning.service';
import { AutonomousCopilotService } from './autonomous-copilot.service';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiHttpClientService } from '../../common/ai-http-client.service';
import { AiMemoryService } from '../ai/ai-memory.service';
import { AutonomousExecutiveBrainService } from './autonomous-executive-brain.service';
import { AiAgentMarketplaceService } from './ai-agent-marketplace.service';
import { EnterpriseDigitalTwinService } from './enterprise-digital-twin.service';
import { AutonomousStrategyService } from './autonomous-strategy.service';
// AI Engine 8 Layers
import { AiHrCoreService } from './layers/ai-hr-core.service';
import { AiRecruitmentEngineService } from './layers/ai-recruitment-engine.service';
import { AiTalentIntelligenceService } from './layers/ai-talent-intelligence.service';
import { AiWorkforceAnalyticsService } from './layers/ai-workforce-analytics.service';
import { AiDecisionEngineService } from './layers/ai-decision-engine.service';
import { AiSecurityEngineService } from './layers/ai-security-engine.service';
import { AiVoiceTextAssistantService } from './layers/ai-voice-text-assistant.service';
import { AiAutomationEngineService } from './layers/ai-automation-engine.service';

import { EmployeeModule } from '../employee/employee.module';
import { PayrollModule } from '../payroll/payroll.module';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { LeaveRequestEntity } from '../../database/entities/leave-request.entity';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { CandidateProfileEntity } from '../../database/entities/candidate-profile.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { LoginHistoryEntity } from '../../database/entities/login-history.entity';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { DocumentRecordEntity } from '../../database/entities/document-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiInsightEntity,
      EmployeeEntity,
      LeaveRequestEntity,
      RecruitmentJobEntity,
      CandidateProfileEntity,
      RecruitmentApplicationEntity,
      LoginHistoryEntity,
      AuditLogEntity,
      DocumentRecordEntity,
    ]),
    EmployeeModule,
    PayrollModule,
  ],
  controllers: [AiEngineController, ForensicAdvisoryController, AiEngineRestController],
  providers: [
    AiEngineService,
    AiProviderService,
    ForensicAdvisoryService,
    AiHttpClientService,
    AiMemoryService,
    AiMatchingService,
    AiWorkforcePlanningService,
    AutonomousCopilotService,
    AutonomousExecutiveBrainService,
    AiAgentMarketplaceService,
    EnterpriseDigitalTwinService,
    AutonomousStrategyService,
    RolesGuard,
    // 8-Layer AI Engine Services
    AiHrCoreService,
    AiRecruitmentEngineService,
    AiTalentIntelligenceService,
    AiWorkforceAnalyticsService,
    AiDecisionEngineService,
    AiSecurityEngineService,
    AiVoiceTextAssistantService,
    AiAutomationEngineService,
  ],
  exports: [
    AiEngineService,
    AiProviderService,
    ForensicAdvisoryService,
    AiHttpClientService,
    AiMemoryService,
    AiMatchingService,
    AiWorkforcePlanningService,
    AutonomousCopilotService,
    AutonomousExecutiveBrainService,
    AiAgentMarketplaceService,
    EnterpriseDigitalTwinService,
    AutonomousStrategyService,
    // 8-Layer AI Engine Services
    AiHrCoreService,
    AiRecruitmentEngineService,
    AiTalentIntelligenceService,
    AiWorkforceAnalyticsService,
    AiDecisionEngineService,
    AiSecurityEngineService,
    AiVoiceTextAssistantService,
    AiAutomationEngineService,
  ],
})
export class AiEngineModule {}
