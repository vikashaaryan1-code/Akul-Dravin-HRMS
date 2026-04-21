import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CompanyEntity } from '../../database/entities/company.entity';
import { SettingsCache } from './settings-cache';
import { SettingsResolver } from './settings-resolver';
import { OrganizationSettingsSchema } from './schemas/organization-settings.schema';

@Injectable()
export class SettingsService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Primary entry point to resolve and get configuration for a tenant.
   */
  async resolveSettings(tenantId: string): Promise<OrganizationSettingsSchema> {
    // 1. Check Cache
    const cached = SettingsCache.get(tenantId);
    if (cached) return cached;

    // 2. Fetch from DB
    const company = await this.dataSource.getRepository(CompanyEntity).findOne({
      where: { tenantId },
      select: ['id', 'tenantId', 'settings'],
    });

    if (!company) {
      throw new NotFoundException(`Company with tenantId ${tenantId} not found`);
    }

    // 3. Resolve (Merge + Validate)
    const settings = SettingsResolver.resolve(company.settings || {});

    // 4. Cache and Return
    SettingsCache.set(tenantId, settings);
    return settings;
  }

  /**
   * Direct accessors following the requested pattern:
   * const config = this.settings.getPayrollConfig();
   */
  async getPayrollConfig(tenantId: string) {
    const settings = await this.resolveSettings(tenantId);
    return settings.payroll;
  }

  async getFinancialConfig(tenantId: string) {
    const settings = await this.resolveSettings(tenantId);
    return settings.financial;
  }
}
