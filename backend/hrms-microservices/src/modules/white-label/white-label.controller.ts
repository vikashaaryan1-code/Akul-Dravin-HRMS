import { Controller, Post, Get, Put, Body, Param, Query } from '@nestjs/common';
import { WhiteLabelService } from './white-label.service';

@Controller('api/v1/white-label')
export class WhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  @Post('partner')
  async createPartner(@Body() data: any) {
    return await this.whiteLabelService.createPartner(data);
  }

  @Get('partner/domain')
  async getPartnerByDomain(@Query('domain') domain: string) {
    return await this.whiteLabelService.getPartnerByDomain(domain);
  }

  @Get('partner/:id')
  async getPartner(@Param('id') id: string) {
    return await this.whiteLabelService.getPartnerById(id);
  }

  @Get('partners')
  async getAllPartners() {
    return await this.whiteLabelService.getAllPartners();
  }

  @Put('partner/:id/branding')
  async updateBranding(@Param('id') id: string, @Body() branding: any) {
    return await this.whiteLabelService.updateBranding(id, branding);
  }

  @Put('partner/:id/features')
  async updateFeatures(@Param('id') id: string, @Body() body: { features: any }) {
    return await this.whiteLabelService.updateFeatures(id, body.features);
  }

  @Get('partner/:id/stats')
  async getPartnerStats(@Param('id') id: string) {
    return await this.whiteLabelService.getPartnerStats(id);
  }

  @Post('partner/:id/client/add')
  async addClient(@Param('id') id: string) {
    await this.whiteLabelService.incrementClientCount(id);
    return { success: true };
  }

  @Post('partner/:id/client/remove')
  async removeClient(@Param('id') id: string) {
    await this.whiteLabelService.decrementClientCount(id);
    return { success: true };
  }

  @Post('partner/:id/revenue')
  async updateRevenue(@Param('id') id: string, @Body() body: { amount: number }) {
    await this.whiteLabelService.updateRevenue(id, body.amount);
    return { success: true };
  }
}
