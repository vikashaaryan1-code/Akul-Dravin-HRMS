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

    const isAuditLog = entity.constructor?.name === 'AuditLogEntity';
    const tenantId = TenantContext.getTenantId();
    if (!tenantId && !isAuditLog) {
      throw new Error("Tenant context missing");
    }

    if (tenantId) {
      entity.tenantId = tenantId;
    }
    
    // Phase 🏁-Final: Automatic Governance Provenance Binding
    const provenance = TenantContext.getProvenance();
    if ('governanceProvenanceHash' in entity) {
      entity.governanceProvenanceHash = provenance.epochHash;
    }
    if ('epistemicConfidence' in entity) {
      entity.epistemicConfidence = provenance.confidence;
    }

    if (tenantId) {
      await this.setTenantSession(event.queryRunner, tenantId);
    }
  }

  async beforeUpdate(event: UpdateEvent<any>) {
    const entity = event.entity;
    const tenantId = this.getRequiredTenantId(entity);
    
    // Phase 🏁-Final: Automatic Governance Provenance Binding
    if (entity) {
      const provenance = TenantContext.getProvenance();
      if ('governanceProvenanceHash' in entity) {
        entity.governanceProvenanceHash = provenance.epochHash;
      }
      if ('epistemicConfidence' in entity) {
        entity.epistemicConfidence = provenance.confidence;
      }
    }

    if (tenantId) {
      await this.setTenantSession(event.queryRunner, tenantId);
    }
  }

  async beforeRemove(event: RemoveEvent<any>) {
    const tenantId = this.getRequiredTenantId(event.entity);
    if (tenantId) {
      await this.setTenantSession(event.queryRunner, tenantId);
    }
  }

  private getRequiredTenantId(entity?: any): string | null {
    const isAuditLog = entity?.constructor?.name === 'AuditLogEntity';
    const tenantId = TenantContext.getTenantId();
    if (!tenantId && !isAuditLog) {
      throw new Error("Tenant context missing");
    }
    return tenantId;
  }

  private async setTenantSession(queryRunner: any, tenantId: string) {
    // Set the session variable for Postgres RLS
    await queryRunner.query(`SET app.tenant_id = '${tenantId}'`);
  }
}
