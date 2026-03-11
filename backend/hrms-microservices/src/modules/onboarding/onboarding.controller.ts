import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { Onboarding } from './onboarding.entity';

@Controller('onboardings')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  findAll(): Promise<Onboarding[]> {
    return this.onboardingService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.onboardingService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Onboarding> {
    return this.onboardingService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Onboarding>): Promise<Onboarding> {
    return this.onboardingService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Onboarding>): Promise<Onboarding> {
    return this.onboardingService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.onboardingService.remove(id);
  }
}
