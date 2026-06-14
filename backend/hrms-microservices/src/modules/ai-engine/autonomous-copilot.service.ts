import { Injectable, Logger } from '@nestjs/common';
import { AiEngineService } from './ai-engine.service';

export interface CopilotQuery {
  tenantId: string;
  userId: string;
  query: string;
  context?: any;
}

@Injectable()
export class AutonomousCopilotService {
  private readonly logger = new Logger(AutonomousCopilotService.name);

  constructor(private readonly aiEngine: AiEngineService) {}

  /**
   * Enterprise AI Workforce Copilot.
   * Handles conversational queries and provides autonomous decision support.
   */
  async interact(request: CopilotQuery) {
    this.logger.log(`Copilot Interaction: "${request.query}" for tenant=${request.tenantId}`);

    const prompt = `
      You are the PUERI Autonomous Workforce Copilot. 
      You have access to HRMS, ATS, Payroll, and Analytics data for tenant ${request.tenantId}.
      User query: "${request.query}"
      
      Respond in a professional, enterprise-grade tone. 
      If the user asks for data analysis, provide executive summaries and actionable insights.
      Format: "Insight: [text] \nAction: [text] \nConfidence: [percentage]"
    `;

    const result = await this.aiEngine.chat({
      tenantId: request.tenantId,
      userId: request.userId,
      messages: [{ role: 'user', content: prompt }],
      context: { module: 'copilot', ...request.context }
    });

    return {
      response: result.message.content,
      suggestedActions: [
        { label: 'Run Payroll Audit', action: 'trigger_payroll_audit' },
        { label: 'View Attrition Heatmap', action: 'view_attrition_analytics' }
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generates proactive "Morning Briefings" for HR Managers.
   */
  async generateMorningBriefing(tenantId: string) {
    this.logger.log(`Generating autonomous morning briefing for tenant=${tenantId}`);
    
    return this.interact({
      tenantId,
      userId: 'system',
      query: 'Provide a summary of critical workforce events for today, including payroll risks and hiring funnel status.'
    });
  }
}
