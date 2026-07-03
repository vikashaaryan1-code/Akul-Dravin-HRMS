import { Controller, Get } from '@nestjs/common';

@Controller('mock-api')
export class MockApiController {
  constructor() {}

  @Get('ai-engine/compensation')
  getCompensation() {
    return [
      { dept: 'Engineering', role: 'Senior Architect', current: 165000, recommended: 182000, marketP50: 175000 },
      { dept: 'Product', role: 'Lead PM', current: 145000, recommended: 155000, marketP50: 152000 },
      { dept: 'Sales', role: 'Account Exec', current: 95000, recommended: 110000, marketP50: 105000 },
    ];
  }

  @Get('ai-engine/promotions')
  getPromotions() {
    return [
      { id: '1', name: 'Elena Rostova', role: 'Data Scientist', tenure: '3y 4m', risk: 'High', readiness: 94 },
      { id: '2', name: 'Marcus Chen', role: 'Frontend Dev', tenure: '2y 11m', risk: 'Medium', readiness: 88 },
      { id: '3', name: 'Sarah Jenkins', role: 'Ops Analyst', tenure: '4y 1m', risk: 'Critical', readiness: 97 },
    ];
  }

  @Get('benefits/coverage')
  getCoverage() {
    return [
      { type: 'Medical', provider: 'BlueCross BlueShield', plan: 'PPO Gold', tier: 'Employee + Spouse', cost: 185.00 },
      { type: 'Dental', provider: 'Delta Dental', plan: 'Premium', tier: 'Employee + Spouse', cost: 24.50 },
      { type: 'Vision', provider: 'VSP', plan: 'Standard', tier: 'Employee Only', cost: 8.00 },
    ];
  }

  @Get('benefits/retirement')
  getRetirement() {
    return {
      provider: 'Fidelity Investments',
      balance: 84250,
      contribution: 8.0,
      match: 4.0,
      status: 'Maximizing match'
    };
  }

  @Get('surveys/polls')
  getPolls() {
    return [
      { id: '1', title: 'Q3 Remote Work Satisfaction', sent: 1450, completed: 1102, deadline: 'Oct 20, 2026', status: 'Active' },
      { id: '2', title: 'New Cafeteria Menu Vote', sent: 420, completed: 415, deadline: 'Oct 15, 2026', status: 'Closing Soon' },
      { id: '3', title: 'Engineering Manager 360', sent: 45, completed: 12, deadline: 'Oct 25, 2026', status: 'Active' },
    ];
  }

  @Get('surveys/enps')
  async getEnps() {
    return {
      score: 55,
      promoters: 65,
      passives: 25,
      detractors: 10
    };
  }
}
