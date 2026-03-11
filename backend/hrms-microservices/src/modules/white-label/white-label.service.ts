import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhiteLabelPartner } from '../../database/entities/white-label-partner.entity';

@Injectable()
export class WhiteLabelService {
  constructor(
    @InjectRepository(WhiteLabelPartner)
    private partnerRepo: Repository<WhiteLabelPartner>,
  ) {}

  async createPartner(data: Partial<WhiteLabelPartner>) {
    const partner = this.partnerRepo.create(data);
    return await this.partnerRepo.save(partner);
  }

  async getPartnerByDomain(domain: string) {
    return await this.partnerRepo.findOne({
      where: [{ subdomain: domain }, { customDomain: domain }],
    });
  }

  async getPartnerById(id: string) {
    return await this.partnerRepo.findOne({ where: { id } });
  }

  async updateBranding(partnerId: string, branding: {
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    companyName?: string;
  }) {
    await this.partnerRepo.update(partnerId, branding);
    return await this.getPartnerById(partnerId);
  }

  async updateFeatures(partnerId: string, features: any) {
    await this.partnerRepo.update(partnerId, { features });
    return await this.getPartnerById(partnerId);
  }

  async getAllPartners() {
    return await this.partnerRepo.find({ where: { isActive: true } });
  }

  async getPartnerStats(partnerId: string) {
    const partner = await this.getPartnerById(partnerId);
    return {
      clientCount: partner.clientCount,
      monthlyRevenue: partner.monthlyRevenue,
      isActive: partner.isActive,
      planId: partner.planId,
    };
  }

  async incrementClientCount(partnerId: string) {
    await this.partnerRepo.increment({ id: partnerId }, 'clientCount', 1);
  }

  async decrementClientCount(partnerId: string) {
    await this.partnerRepo.decrement({ id: partnerId }, 'clientCount', 1);
  }

  async updateRevenue(partnerId: string, amount: number) {
    const partner = await this.getPartnerById(partnerId);
    await this.partnerRepo.update(partnerId, {
      monthlyRevenue: Number(partner.monthlyRevenue) + amount,
    });
  }
}
