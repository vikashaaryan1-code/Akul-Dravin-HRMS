import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayrollService } from './payroll.service';
import { TenantContext } from '../../common/context/tenant-context';
import { DataSource } from 'typeorm';
import { EmployeeEntity } from '../../database/entities/employee.entity';

@Injectable()
export class PayrollCronService {
  private readonly logger = new Logger(PayrollCronService.name);

  constructor(
    private readonly payrollService: PayrollService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Monthly Payroll Trigger: Runs on the 25th of every month at midnight.
   * Generates payroll batches for active tenants.
   */
  @Cron('0 0 25 * *')
  async handleMonthlyPayroll() {
    this.logger.log('CRON: Triggering monthly payroll generation');
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    const activeTenants = await this.dataSource.getRepository(EmployeeEntity)
      .createQueryBuilder('e')
      .select('DISTINCT e.tenantId', 'tenantId')
      .getRawMany();

    const mockSettings: any = { features: { enableAiRecruitment: true, enableCryptoPayroll: false } };
    const mockGov = { epochHash: 'SYSTEM_CRON', confidence: 100, residualRisk: 'NONE' };

    for (const { tenantId } of activeTenants) {
      if (!tenantId) continue;
      await TenantContext.runScoped(tenantId, mockSettings, mockGov, async () => {
      try {
        this.logger.log(`Generating payroll for month ${currentMonth}/${currentYear}`);
        const batch = await this.payrollService.generateBatch(currentYear, currentMonth);

        // Perform Anomaly Scan before locking
        const isAnomalous = this.scanForAnomalies(batch);
        
        if (isAnomalous) {
          this.logger.warn(`CRON: Anomalies detected in payroll batch ${batch.id}. Manual review required.`);
          // Could trigger an alert/notification event here
          return;
        }

        this.logger.log(`CRON: Batch ${batch.id} clean. Proceeding to lock and execute.`);
        
        // Lock batch (Transition Engine will handle rules and journaling)
        const lockedBatch = await this.payrollService.lockBatch(batch.id);

        // Trigger Execution
        await this.payrollService.executeBatch(lockedBatch.id);
        
        this.logger.log(`CRON: Monthly payroll execution orchestrated successfully for batch ${batch.id}`);
        
      } catch (error: any) {
        this.logger.error(`CRON: Monthly payroll failed - ${error.message}`, error.stack);
      }
    });
    }
  }

  /**
   * Anomaly Detection Scan
   * Rules:
   * 1. Total Gross > 0
   * 2. No negative net pay
   * 3. Deductions shouldn't be suspiciously high (> 50% of gross)
   */
  private scanForAnomalies(batch: any): boolean {
    if (!batch || !batch.items || batch.items.length === 0) {
      this.logger.warn('Anomaly: Empty batch');
      return true;
    }

    let anomalyDetected = false;

    for (const item of batch.items) {
      const gross = parseFloat(item.grossSalary);
      const net = parseFloat(item.netPayable);
      const deductions = parseFloat(item.deductions);

      if (gross <= 0) {
        this.logger.warn(`Anomaly: Zero or negative gross salary for employee ${item.employeeId}`);
        anomalyDetected = true;
      }
      
      if (net < 0) {
        this.logger.warn(`Anomaly: Negative net payable for employee ${item.employeeId}`);
        anomalyDetected = true;
      }

      if (deductions > (gross * 0.5)) {
        this.logger.warn(`Anomaly: Suspiciously high deductions (>50%) for employee ${item.employeeId}`);
        anomalyDetected = true;
      }
    }

    return anomalyDetected;
  }
}
