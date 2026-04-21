import { ForbiddenException } from '@nestjs/common';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
  InsertEvent,
  RemoveEvent,
} from 'typeorm';
import { TenantContext } from '../context/tenant-context';

@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  async beforeInsert(event: InsertEvent<any>) {
    const entity = event.entity;
    if (!entity) return;

    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error("Tenant context missing");
    }

    entity.tenantId = tenantId;
    await this.setTenantSession(event.queryRunner, tenantId);
  }

  async beforeUpdate(event: UpdateEvent<any>) {
    const tenantId = this.getRequiredTenantId();
    await this.setTenantSession(event.queryRunner, tenantId);
  }

  async beforeRemove(event: RemoveEvent<any>) {
    const tenantId = this.getRequiredTenantId();
    await this.setTenantSession(event.queryRunner, tenantId);
  }

  private getRequiredTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error("Tenant context missing");
    }
    return tenantId;
  }

  private async setTenantSession(queryRunner: any, tenantId: string) {
    // Set the session variable for Postgres RLS
    await queryRunner.query(`SET app.tenant_id = '${tenantId}'`);
  }
}
