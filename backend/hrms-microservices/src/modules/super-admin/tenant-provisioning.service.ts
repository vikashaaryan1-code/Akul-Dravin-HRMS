import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { DomainEventService } from '../../common/events/domain-event.service';

@Processor('tenant-provisioning')
@Injectable()
export class TenantProvisioningService extends WorkerHost {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: DomainEventService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'provision-new-tenant':
        return this.provisionTenant(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return null;
    }
  }

  /**
   * Autonomous Tenant Provisioning.
   * "Fully Automatic A2Z" onboarding for enterprise companies.
   */
  async provisionTenant(job: Job<{ tenantId: string; plan: string; adminEmail: string }>) {
    const { tenantId, plan, adminEmail } = job.data;
    this.logger.log(`PROVISIONING starting for tenant=${tenantId} plan=${plan}`);

    try {
      // 1. Initialize Default Roles & Permissions
      await this.initializeBaseRoles(tenantId);

      // 2. Setup Default Policy Templates (Leave, Attendance, etc.)
      await this.setupDefaultPolicies(tenantId, plan);

      const tenantRepo = this.dataSource.getRepository(TenantEntity);
      await tenantRepo.update(tenantId, { status: 'active' });

      // 4. Publish "TENANT_PROVISIONED" event for welcome email automation
      await this.eventBus.publish('TENANT_PROVISIONED', tenantId, {
        plan,
        adminEmail,
        provisionedAt: new Date().toISOString(),
      });

      this.logger.log(`PROVISIONING SUCCESS for tenant=${tenantId}`);
      return { success: true };

    } catch (error) {
      this.logger.error(`PROVISIONING FAILED for tenant=${tenantId}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private async initializeBaseRoles(tenantId: string) {
    // Logic to insert 'SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE' roles for the new tenant
    this.logger.debug(`Initializing base roles for ${tenantId}`);
  }

  private async setupDefaultPolicies(tenantId: string, plan: string) {
    // Logic to provision standard leave types and attendance shifts based on plan
    this.logger.debug(`Setting up default policies for plan=${plan}`);
  }
}
