import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayrollService } from './payroll.service';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class PayrollCronService {
  private readonly logger = new Logger(PayrollCronService.name);

  constructor(private readonly payrollService: PayrollService) {}

  /**
   * Monthly Payroll Trigger: Runs on the 25th of every month at midnight.
   * Generates payroll batches for active tenants.
   */
  @Cron('0 0 25 * *')
  async handleMonthlyPayroll() {
    this.logger.log('CRON: Triggering monthly payroll generation');
    
    // In a real multi-tenant system, we would iterate over all active tenants.
    // For this demonstration, we'll assume a global context or use a system tenant.
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    try {
      // Simulate tenant context
      TenantContext.setTenantId('00000000-0000-0000-0000-000000000001');

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
    } finally {
      TenantContext.clear();
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
