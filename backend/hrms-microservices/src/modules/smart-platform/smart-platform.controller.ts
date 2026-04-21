import { Controller, Get } from '@nestjs/common';
import { SmartPlatformService } from './smart-platform.service';

@Controller('platform')
export class SmartPlatformController {
  constructor(private readonly smartPlatformService: SmartPlatformService) {}

  @Get('readiness')
  getReadiness() {
    return this.smartPlatformService.getReadiness();
  }
}
