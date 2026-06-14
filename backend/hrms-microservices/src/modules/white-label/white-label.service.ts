import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhiteLabelConfigEntity } from '../../database/entities/white-label-config.entity';

export interface UpsertWhiteLabelDto {
  brandName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  sidebarBg?: string;
  customDomain?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
  loginBgUrl?: string;
  loginTagline?: string;
  featureToggles?: Record<string, boolean>;
  customCss?: string;
}

@Injectable()
export class WhiteLabelService {
  constructor(
    @InjectRepository(WhiteLabelConfigEntity)
    private readonly configRepo: Repository<WhiteLabelConfigEntity>,
  ) {}

  async getConfig(tenantId: string): Promise<WhiteLabelConfigEntity | null> {
    return this.configRepo.findOne({ where: { tenantId } });
  }

  async upsertConfig(tenantId: string, payload: UpsertWhiteLabelDto): Promise<WhiteLabelConfigEntity> {
    const existing = await this.configRepo.findOne({ where: { tenantId } });
    if (existing) {
      const merged = this.configRepo.merge(existing, payload as Partial<WhiteLabelConfigEntity>);
      return this.configRepo.save(merged);
    }
    const config = this.configRepo.create({ tenantId, ...payload });
    return this.configRepo.save(config);
  }

  async toggleFeature(tenantId: string, feature: string, enabled: boolean): Promise<WhiteLabelConfigEntity> {
    const config = await this.getConfig(tenantId);
    const toggles = config?.featureToggles ?? {};
    toggles[feature] = enabled;
    return this.upsertConfig(tenantId, { featureToggles: toggles });
  }

  async resetToDefaults(tenantId: string): Promise<WhiteLabelConfigEntity> {
    return this.upsertConfig(tenantId, {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#22d3ee',
      featureToggles: {},
    });
  }
}
