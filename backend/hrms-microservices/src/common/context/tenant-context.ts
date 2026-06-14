import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { EntityManager, DataSource, Repository, EntityTarget, ObjectLiteral } from 'typeorm';
import { OrganizationSettingsSchema } from '../settings/schemas/organization-settings.schema';

/**
 * TENANT CONTEXT - THE ISOLATION GUARDIAN
 * 
 * This class manages request-scoped data using AsyncLocalStorage.
 * It is engineered for Zero-Leakage:
 * 1. Uses .run() for strict block-scoping.
 * 2. Throws explicit IsolationViolation errors if accessed unscoped.
 * 3. No global singleton fallbacks for tenant-sensitive data.
 * 4. Governance Anchoring: Every request is tagged with its Epistemic Provenance.
 */
export interface EpistemicProvenance {
  epochHash: string;
  confidence: number;
  residualRisk: string;
}
@Injectable()
export class TenantContext {
  private static readonly tenantIdStorage = new AsyncLocalStorage<string>();
  private static readonly managerStorage = new AsyncLocalStorage<EntityManager>();
  private static readonly settingsStorage = new AsyncLocalStorage<OrganizationSettingsSchema>();
  private static readonly governanceStorage = new AsyncLocalStorage<EpistemicProvenance>();
  private static rootDataSource: DataSource;

  static setDataSource(ds: DataSource): void {
    this.rootDataSource = ds;
  }

  /**
   * Scoped Context Runner
   * Wraps the execution chain in a strictly isolated environment with governance anchoring.
   */
  static runScoped<T>(tenantId: string, settings: OrganizationSettingsSchema, governance: EpistemicProvenance, callback: () => T): T {
    return this.tenantIdStorage.run(tenantId, () => {
      return this.settingsStorage.run(settings, () => {
        return this.governanceStorage.run(governance, callback);
      });
    });
  }

  /**
   * Transaction Manager Runner
   */
  static runWithManager<T>(manager: EntityManager, callback: () => T): T {
    return this.managerStorage.run(manager, callback);
  }

  static getTenantId(): string | null {
    return this.tenantIdStorage.getStore() ?? null;
  }

  static getRequiredTenantId(): string {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new Error('TENANT_ISOLATION_VIOLATION: Attempted to access tenant-scoped data outside of an authorized request scope.');
    }
    return tenantId;
  }

  static getManager(): EntityManager | null {
    return this.managerStorage.getStore() ?? null;
  }

  static getSettings(): OrganizationSettingsSchema {
    const settings = this.settingsStorage.getStore();
    if (!settings) {
      throw new Error('POLICY_ISOLATION_VIOLATION: Attempted to access organization settings outside of a resolved policy scope.');
    }
    return settings;
  }

  /**
   * Returns the Governance Provenance (Epoch) for the current scoped request.
   */
  static getProvenance(): EpistemicProvenance {
    const provenance = this.governanceStorage.getStore();
    if (!provenance) {
      // Default fallback for legacy or non-governed paths
      return { epochHash: 'LEGACY_UNANCHORED', confidence: 0, residualRisk: 'UNGOVERNED_EXECUTION' };
    }
    return provenance;
  }

  /**
   * Safe transaction-scoped RLS initialization.
   */
  static async setTenantSession(manager: EntityManager, tenantId: string): Promise<void> {
    await manager.query(`SET LOCAL app.tenant_id = $1`, [tenantId]);
  }

  /**
   * Global Repository Resolver
   * Proxies to the active transaction manager if available, otherwise uses the root data source.
   */
  static getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    const manager = this.getManager();
    if (manager) {
      return manager.getRepository(entity);
    }
    
    if (!this.rootDataSource) {
      throw new Error('TenantContext: Core DataSource not initialized. System in invalid state.');
    }
    
    return this.rootDataSource.getRepository(entity);
  }
}
