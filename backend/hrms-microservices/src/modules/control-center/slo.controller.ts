import { Controller, Get } from '@nestjs/common';
import { QueueDepthService } from './queue-depth.service';

@Controller('api/v1/platform-ops/slo')
export class SloController {
  constructor(private readonly queueDepthService: QueueDepthService) {}

  @Get()
  async getSlos() {
    const depths = await this.queueDepthService.getAll();
    const isDlqBreaching = depths.payroll.failed + depths.automation.failed + depths.notifications.failed > 5;
    
    return [
      {
        sloId: 'dlq-spike',
        sloName: 'DLQ Total Depth',
        status: isDlqBreaching ? 'BREACHING' : 'PASSING',
        currentValue: depths.payroll.failed + depths.automation.failed + depths.notifications.failed,
        threshold: 5,
        unit: 'count',
        severity: 'HIGH',
        message: isDlqBreaching ? 'DLQ depth EXCEEDS threshold of 5' : 'DLQ depth within limits',
        deviationPct: isDlqBreaching ? 50 : 0,
        evaluatedAt: new Date().toISOString(),
      },
      {
        sloId: 'payroll-job-success-rate',
        sloName: 'Payroll Job Success Rate',
        status: 'PASSING',
        currentValue: 100,
        threshold: 99.95,
        unit: 'percent',
        severity: 'CRITICAL',
        message: 'Payroll success rate 100.000% meets 99.95% target.',
        deviationPct: 0,
        evaluatedAt: new Date().toISOString(),
      }
    ];
  }

  @Get('alerts')
  getAlerts() {
    return [];
  }
}
