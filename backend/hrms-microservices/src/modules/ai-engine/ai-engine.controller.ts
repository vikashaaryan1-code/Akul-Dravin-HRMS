import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AiEngineService } from './ai-engine.service';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-engine')
export class AiEngineController {
  constructor(private readonly aiEngineService: AiEngineService) {}

  @Get('insights')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAllInsights() {
    return this.aiEngineService.findAllInsights();
  }

  @Get('insights/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findOneInsight(@Param('id') id: string) {
    return this.aiEngineService.findOneInsight(id);
  }

  @Post('insights')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  createInsight(@Body() payload: Partial<AiInsightEntity>) {
    return this.aiEngineService.createInsight(payload);
  }

  @Patch('insights/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  updateInsight(@Param('id') id: string, @Body() payload: Partial<AiInsightEntity>) {
    return this.aiEngineService.updateInsight(id, payload);
  }

  @Post('recommendations')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  generateRecommendation(@Body() payload: Record<string, unknown>) {
    return this.aiEngineService.generateRecommendation(payload);
  }

  @Post('candidate-match')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  scoreCandidateMatch(@Body() payload: Record<string, unknown>) {
    return this.aiEngineService.scoreCandidateMatch(payload);
  }

  @Post('attrition-risk')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  predictAttritionRisk(@Body() payload: Record<string, unknown>) {
    return this.aiEngineService.predictAttritionRisk(payload);
  }

  @Post('salary-forecast')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
  forecastSalary(@Body() payload: Record<string, unknown>) {
    return this.aiEngineService.forecastSalary(payload);
  }
}
