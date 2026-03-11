import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { OfferService } from './offer.service';

@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  create(@Body() data: any) {
    return this.offerService.create(data);
  }

  @Get()
  findAll() {
    return this.offerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offerService.findOne(id);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.offerService.accept(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.offerService.reject(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.offerService.update(id, data);
  }
}
