import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MarketingCampaignEntity,
  MarketingChannel,
  MarketingCampaignStatus,
} from '../../database/entities/marketing-campaign.entity';

interface CreateCampaignDto {
  campaignName: string;
  description?: string;
  channel: MarketingChannel;
  audienceSize?: number;
  scheduledAt?: string;
  createdById?: string;
  tenantId?: string;
}

interface UpdateCampaignDto {
  campaignName?: string;
  description?: string;
  channel?: MarketingChannel;
  status?: MarketingCampaignStatus;
  audienceSize?: number;
  reach?: number;
  conversions?: number;
  spend?: number;
  scheduledAt?: string;
}

@Injectable()
export class MarketingAutomationService {
  private readonly logger = new Logger(MarketingAutomationService.name);

  constructor(
    @InjectRepository(MarketingCampaignEntity)
    private readonly campaignRepo: Repository<MarketingCampaignEntity>,
  ) {}

  // ── List campaigns ───────────────────────────────────────────────────────────
  getCampaigns(tenantId?: string): Promise<MarketingCampaignEntity[]> {
    const where = tenantId ? { tenantId } : {};
    return this.campaignRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // ── Channel performance distribution ────────────────────────────────────────
  async getPerformance(tenantId?: string): Promise<{ name: string; value: number }[]> {
    const qb = this.campaignRepo
      .createQueryBuilder('mc')
      .select('mc.channel', 'name')
      .addSelect('SUM(mc.reach)', 'totalReach');

    if (tenantId) {
      qb.where('mc.tenantId = :tenantId', { tenantId });
    }

    const rows = await qb.groupBy('mc.channel').getRawMany<{ name: string; totalReach: string }>();
    const total = rows.reduce((s, r) => s + parseFloat(r.totalReach || '0'), 0) || 1;

    return rows.map((r) => ({
      name:  r.name,
      value: Math.round((parseFloat(r.totalReach || '0') / total) * 100),
    }));
  }

  // ── Get single campaign ──────────────────────────────────────────────────────
  async findOne(id: string): Promise<MarketingCampaignEntity> {
    const c = await this.campaignRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Campaign ${id} not found`);
    return c;
  }

  // ── Create campaign ──────────────────────────────────────────────────────────
  async create(dto: CreateCampaignDto): Promise<MarketingCampaignEntity> {
    const entity = this.campaignRepo.create({
      campaignName:  dto.campaignName,
      description:   dto.description ?? null,
      channel:       dto.channel,
      status:        'Draft',
      audienceSize:  dto.audienceSize ?? 0,
      scheduledAt:   dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      createdById:   dto.createdById ?? null,
      tenantId:      dto.tenantId!,
    });
    const saved = await this.campaignRepo.save(entity);
    this.logger.log(`CAMPAIGN_CREATED id=${saved.id} name=${saved.campaignName}`);
    return saved;
  }

  // ── Update campaign ──────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateCampaignDto): Promise<MarketingCampaignEntity> {
    await this.findOne(id);

    // Build a type-safe partial — convert scheduledAt string → Date explicitly
    const updates: Partial<MarketingCampaignEntity> = {
      ...(dto.campaignName  !== undefined && { campaignName:  dto.campaignName }),
      ...(dto.description   !== undefined && { description:   dto.description }),
      ...(dto.channel       !== undefined && { channel:       dto.channel }),
      ...(dto.status        !== undefined && { status:        dto.status }),
      ...(dto.audienceSize  !== undefined && { audienceSize:  dto.audienceSize }),
      ...(dto.reach         !== undefined && { reach:         dto.reach }),
      ...(dto.conversions   !== undefined && { conversions:   dto.conversions }),
      ...(dto.spend         !== undefined && { spend:         dto.spend }),
      ...(dto.scheduledAt   !== undefined && {
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      }),
    };

    // Auto-stamp lifecycle dates on status transitions
    if (dto.status === 'Running') {
      updates.startedAt = new Date();
    }
    if (dto.status === 'Completed' || dto.status === 'Cancelled') {
      updates.completedAt = new Date();
    }

    await this.campaignRepo.update(id, updates);
    this.logger.log(`CAMPAIGN_UPDATED id=${id} status=${dto.status ?? '(unchanged)'}`);
    return this.findOne(id);
  }

  // ── Delete campaign ──────────────────────────────────────────────────────────
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.campaignRepo.delete(id);
    this.logger.log(`CAMPAIGN_DELETED id=${id}`);
  }
}
