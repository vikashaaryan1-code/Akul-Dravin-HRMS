import { Injectable, Logger } from '@nestjs/common';
import { AiEngineService } from './ai-engine.service';

export interface AiAgent {
  id: string;
  name: string;
  role: 'RECRUITER' | 'PAYROLL_AUDITOR' | 'SALES_CLOSER' | 'COMPLIANCE_MONITOR';
  description: string;
  basePrompt: string;
}

@Injectable()
export class AiAgentMarketplaceService {
  private readonly logger = new Logger(AiAgentMarketplaceService.name);

  private readonly agents: AiAgent[] = [
    {
      id: 'agent_recruiter_01',
      name: 'Elite Recruiter Bot',
      role: 'RECRUITER',
      description: 'Autonomous sourcing and resume scoring agent.',
      basePrompt: 'You are an elite recruiter for PUERI OS. Focus on skill verification and cultural fit.',
    },
    {
      id: 'agent_payroll_auditor_01',
      name: 'Forensic Payroll Auditor',
      role: 'PAYROLL_AUDITOR',
      description: 'Scans for payroll leakage and fraud.',
      basePrompt: 'Analyze payroll records for anomalies, duplicates, and compliance drift.',
    },
    {
      id: 'agent_sales_closer_01',
      name: 'AI Sales Closer',
      role: 'SALES_CLOSER',
      description: 'Handles lead qualification and contract closing.',
      basePrompt: 'Qualify enterprise leads and generate high-conversion proposals.',
    },
  ];

  constructor(private readonly aiEngine: AiEngineService) {}

  /**
   * Retrieves available AI agents for the marketplace.
   */
  async getAvailableAgents() {
    return this.agents;
  }

  /**
   * Customizes an AI agent for a specific tenant.
   * "Tenant-Specific" AI tuning.
   */
  async deployAgentToTenant(tenantId: string, agentId: string, customInstructions: string) {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    this.logger.log(`Deploying customized ${agent.name} to tenant=${tenantId}`);

    const tunedPrompt = `${agent.basePrompt}\n\nTenant-Specific Instructions: ${customInstructions}`;

    // Logic to persist the tuned prompt in a TenantAiAgentConfigEntity
    return {
      success: true,
      tenantId,
      agentId,
      status: 'ACTIVE',
      tunedPromptPreview: tunedPrompt.slice(0, 100),
    };
  }

  /**
   * Executes a task using a deployed AI agent.
   */
  async executeAgentTask(tenantId: string, agentId: string, taskDescription: string) {
    this.logger.log(`Agent ${agentId} executing task for tenant=${tenantId}`);

    const result = await this.aiEngine.chat({
      tenantId,
      userId: `agent-${agentId}`,
      messages: [{ role: 'user', content: taskDescription }]
    });

    return {
      agentId,
      result: result.message.content,
      executedAt: new Date().toISOString(),
    };
  }
}
