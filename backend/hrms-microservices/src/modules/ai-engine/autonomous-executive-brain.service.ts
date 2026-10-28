import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiEngineService } from './ai-engine.service';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { PayrollBatchEntity } from '../../database/entities/payroll-batch.entity';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class AutonomousExecutiveBrainService {
  private readonly logger = new Logger(AutonomousExecutiveBrainService.name);

  constructor(
    private readonly aiEngine: AiEngineService,
    @InjectRepository(AiInsightEntity)
    private readonly insightRepo: Repository<AiInsightEntity>,
  ) {}

  /**
   * Generates a high-level business strategy report.
   * "AI CEO Mode" Executive Intelligence.
   *
   * PERFORMANCE OPTIMIZATION:
   * Previously loaded all employee and payroll records into Node.js memory via
   * `employeeService.findAll()` and `payrollService.findAll()`, causing O(N) memory allocation and JS filtering.
   * Optimized to run SQL aggregation queries directly in the database via TypeORM's createQueryBuilder,
   * returning consolidated metrics in constant O(1) memory.
   */
  async generateExecutiveStrategy(tenantId: string) {
    this.logger.log(`AI CEO Mode: Generating executive strategy for tenant=${tenantId}`);

    // Direct SQL Aggregation for Employee Metrics using Entity Property Names
    const empRepo = TenantContext.getRepository(EmployeeEntity);
    const empStats = await empRepo
      .createQueryBuilder('e')
      .select('COUNT(*)', 'headcount')
      .addSelect(`COUNT(CASE WHEN e.status = 'active' THEN 1 END)`, 'activeEmployees')
      .addSelect('SUM(COALESCE(CAST(e.monthlyCtc AS NUMERIC), 0))', 'totalMonthlyCtc')
      .addSelect('COUNT(DISTINCT e.departmentId)', 'departments')
      .where('e.tenantId = :tenantId', { tenantId })
      .getRawOne();

    // Direct Query for Last Payroll Total using Entity Property Names
    const payrollRepo = TenantContext.getRepository(PayrollBatchEntity);
    const lastPayroll = await payrollRepo
      .createQueryBuilder('p')
      .select('CAST(p.totalNet AS NUMERIC)', 'totalNet')
      .where('p.tenantId = :tenantId', { tenantId })
      .orderBy('p.createdAt', 'DESC')
      .getRawOne();

    const context = {
      headcount: parseInt(empStats?.headcount ?? '0', 10),
      activeEmployees: parseInt(empStats?.activeEmployees ?? '0', 10),
      totalMonthlyCtc: parseFloat(empStats?.totalMonthlyCtc ?? '0'),
      lastPayrollTotal: lastPayroll ? parseFloat(lastPayroll.totalNet ?? '0') : 0,
      departments: parseInt(empStats?.departments ?? '0', 10),
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
   *
   * PERFORMANCE OPTIMIZATION:
   * Replaced loading all employee entities with a targeted SQL COUNT query in DB.
   */
  async detectOperationalRisks(tenantId: string) {
    this.logger.log(`AI Brain: Scanning for operational risks in tenant=${tenantId}`);
    
    const empRepo = TenantContext.getRepository(EmployeeEntity);
    const result = await empRepo
      .createQueryBuilder('e')
      .select(`COUNT(CASE WHEN e.status = 'on_notice' THEN 1 END)`, 'attritionRisk')
      .where('e.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const attritionRisk = parseInt(result?.attritionRisk ?? '0', 10);

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
   *
   * PERFORMANCE OPTIMIZATION:
   * Replaced loading all employee entities with SQL GROUP BY departmentId aggregation query.
   */
  async recommendBudgetAllocation(tenantId: string, budget: number) {
    const empRepo = TenantContext.getRepository(EmployeeEntity);
    const rows = await empRepo
      .createQueryBuilder('e')
      .select(`COALESCE(e.departmentId, 'unknown')`, 'deptId')
      .addSelect('COUNT(*)', 'cnt')
      .where('e.tenantId = :tenantId', { tenantId })
      .groupBy('e.departmentId')
      .getRawMany();

    const deptHeadcount: Record<string, number> = {};
    for (const row of rows) {
      deptHeadcount[row.deptId] = parseInt(row.cnt, 10);
    }

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
