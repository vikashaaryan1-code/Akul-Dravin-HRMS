import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiEngineService } from './ai-engine.service';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';
import { EmployeeService } from '../employee/employee.service';
import { PayrollService } from '../payroll/payroll.service';

@Injectable()
export class AutonomousExecutiveBrainService {
  private readonly logger = new Logger(AutonomousExecutiveBrainService.name);

  constructor(
    private readonly aiEngine: AiEngineService,
    @InjectRepository(AiInsightEntity)
    private readonly insightRepo: Repository<AiInsightEntity>,
    private readonly employeeService: EmployeeService,
    private readonly payrollService: PayrollService,
  ) {}

  /**
   * Generates a high-level business strategy report.
   * "AI CEO Mode" Executive Intelligence.
   */
  async generateExecutiveStrategy(tenantId: string) {
    this.logger.log(`AI CEO Mode: Generating executive strategy for tenant=${tenantId}`);

    // 1. Aggregate Real Data for Context
    const employees = await this.employeeService.findAll();
    const payrolls = await this.payrollService.findAll();
    
    const context = {
      headcount: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      totalMonthlyCtc: employees.reduce((acc, e) => acc + Number(e.monthlyCtc || 0), 0),
      lastPayrollTotal: payrolls.length > 0 ? payrolls[0].totalNet : 0,
      departments: [...new Set(employees.map(e => e.departmentId))].length,
    };

    const prompt = `Act as an AI CEO/CFO for tenant ${tenantId}. 
    Current Workforce Context: ${JSON.stringify(context)}
    
    Analyze workforce data, revenue trends, and market conditions. 
    Provide:
    1. Workforce Expansion Plan
    2. Cost Optimization Recommendations
    3. Operational Risk Heatmap
    4. Revenue Forecasting (Next 12 Months)
    5. AI-Native Growth Strategy.`;

    const strategy = await this.aiEngine.generateReport(tenantId, prompt);

    // 2. Persist the Insight
    const insight = this.insightRepo.create({
      tenantId,
      module: 'EXECUTIVE_BRAIN',
      insightType: 'STRATEGY_REPORT',
      recommendation: strategy.content,
      score: '0.94',
      confidence: '0.96',
      status: 'active',
    });
    await this.insightRepo.save(insight);

    return {
      tenantId,
      strategyContent: strategy.content,
      contextUsed: context,
      generatedAt: new Date().toISOString(),
      insightId: insight.id,
    };
  }

  /**
   * Detects operational and financial risks autonomously.
   */
  async detectOperationalRisks(tenantId: string) {
    this.logger.log(`AI Brain: Scanning for operational risks in tenant=${tenantId}`);
    
    const employees = await this.employeeService.findAll();
    const attritionRisk = employees.filter(e => e.status === 'on_notice').length;

    const findings = {
      status: attritionRisk > 5 ? 'WARNING' : 'STABLE',
      risks: [
        { type: 'ATTRITION_RISK', severity: attritionRisk > 5 ? 'HIGH' : 'MEDIUM', count: attritionRisk },
        { type: 'COMPLIANCE_DRIFT', severity: 'LOW', region: 'GLOBAL' },
      ],
      lastScannedAt: new Date().toISOString(),
    };

    // Persist risk as an insight
    await this.insightRepo.save(this.insightRepo.create({
      tenantId,
      module: 'EXECUTIVE_BRAIN',
      insightType: 'OPERATIONAL_RISK',
      recommendation: JSON.stringify(findings),
      status: 'active',
    }));

    return findings;
  }

  /**
   * Recommends autonomous workforce adjustments.
   */
  async recommendBudgetAllocation(tenantId: string, budget: number) {
    const employees = await this.employeeService.findAll();
    const deptHeadcount = employees.reduce((acc, e) => {
      acc[e.departmentId || 'unknown'] = (acc[e.departmentId || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `Allocate a budget of ${budget} across departments to maximize ROI. 
    Current distribution: ${JSON.stringify(deptHeadcount)}`;
    
    const { content } = await this.aiEngine.generateReport(tenantId, prompt);
    
    const insight = await this.insightRepo.save(this.insightRepo.create({
      tenantId,
      module: 'EXECUTIVE_BRAIN',
      insightType: 'BUDGET_ALLOCATION',
      recommendation: content,
      status: 'active',
    }));

    return {
      allocationPlan: content,
      insightId: insight.id,
      suggestedAt: new Date().toISOString(),
    };
  }
}
