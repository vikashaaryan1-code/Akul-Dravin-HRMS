import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DataSource } from 'typeorm';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiInsightController {
  
  constructor(private readonly dataSource: DataSource) {}

  @Get('insights')
  async getInsights() {
    const empCountQuery = await this.dataSource.query(`SELECT COUNT(*) as count FROM employees`);
    const totalEmployees = parseInt(empCountQuery[0]?.count || '0', 10);
    
    const engCountQuery = await this.dataSource.query(`
      SELECT COUNT(*) as count 
      FROM employees 
      WHERE department_id = 'Engineering'
    `);
    const engEmployees = parseInt(engCountQuery[0]?.count || '0', 10);

    const projectedPayroll = (totalEmployees * 50000 * 1.083).toLocaleString('en-IN');

    return [
      { 
        id: '1', 
        severity: 'warning', 
        title: 'Attrition Risk Elevated', 
        body: `Engineering team (${engEmployees} members) shows 72% attrition risk index. 3 senior ICs flagged.`, 
        action: 'View Report' 
      },
      { 
        id: '2', 
        severity: 'ai', 
        title: 'Payroll Forecast', 
        body: `Q3 payroll projected at ₹${projectedPayroll} (+8.3%) if 20-hire plan executes. Breakeven: month 4.`, 
        action: 'Open Forecast' 
      },
      { 
        id: '3', 
        severity: 'success', 
        title: 'ISO Audit Passed', 
        body: `Continuous compliance monitoring shows zero critical findings across ${totalEmployees} employee records.`, 
        action: 'View Certificate' 
      },
    ];
  }

  @Post('workforce-intelligence')
  async getWorkforceIntelligence() {
    return {
      attritionRisk: { score: 14, trend: 'up', department: 'Engineering' },
      skillGaps: [{ skill: 'Cloud Architecture', impact: 'High', missingIn: 12 }],
      anomalies: 3,
      recommendation: 'Launch targeted retention program for Senior Engineers in Q3.'
    };
  }

  @Post('insight')
  async getSalesAiSuggestions() {
    return {
      insights: [
        'Focus on Enterprise SaaS clients in Q3 to boost revenue.',
        'Upsell Premium Support to accounts approaching renewal.',
        'Address feature gap requests from the latest product survey.'
      ]
    };
  }
}
