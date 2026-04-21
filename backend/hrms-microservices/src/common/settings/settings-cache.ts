import { OrganizationSettingsSchema } from './schemas/organization-settings.schema';

export class SettingsCache {
  private static cache = new Map<string, { settings: OrganizationSettingsSchema; timestamp: number }>();
  private static readonly TTL = 60000; // 1 minute cache for performance

  static get(tenantId: string): OrganizationSettingsSchema | null {
    const entry = this.cache.get(tenantId);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(tenantId);
      return null;
    }

    return entry.settings;
  }

  static set(tenantId: string, settings: OrganizationSettingsSchema): void {
    this.cache.set(tenantId, {
      settings,
      timestamp: Date.now(),
    });
  }

  static invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
  }
}
