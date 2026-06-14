import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AiEngineService, ChatCompletionDto, InsightRequest } from './ai-engine.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiEngineController {
  constructor(private readonly aiService: AiEngineService) {}

  @Get('status')
  getStatus() {
    return {
      ...this.aiService.providerStatus,
      message: this.aiService.providerStatus.available
        ? 'AI provider is configured and available'
        : 'No AI API keys configured — using rule-based fallback. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.',
    };
  }

  @Post('chat')
  chat(@Body() dto: ChatCompletionDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.aiService.chat({
      ...dto,
      tenantId: dto.tenantId || user?.tenantId,
      userId: dto.userId || user?.id,
    });
  }

  @Post('insight')
  generateInsight(@Body() req: InsightRequest, @Req() httpReq: Request) {
    const user = (httpReq as any).user;
    return this.aiService.generateInsight({ ...req, tenantId: req.tenantId || user?.tenantId });
  }

  @Post('report')
  generateReport(@Body() body: { reportType: string }, @Req() req: Request) {
    const user = (req as any).user;
    return this.aiService.generateReport(user?.tenantId, body.reportType);
  }

  @Post('hiring-intelligence')
  getHiringIntelligence(@Body() body: { resumeText?: string; jobDescription?: string; skills?: string[]; experienceYears?: number }) {
    return this.aiService.getHiringIntelligence(body);
  }

  @Post('workforce-intelligence')
  getWorkforceIntelligence(@Body() body: { period?: string }, @Req() req: Request) {
    const user = (req as any).user;
    return this.aiService.getWorkforceIntelligence(user?.tenantId, body.period);
  }
}
