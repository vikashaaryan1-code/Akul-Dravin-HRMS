import { Module } from '@nestjs/common';
import { SmartPlatformController } from './smart-platform.controller';
import { SmartPlatformService } from './smart-platform.service';

@Module({
  controllers: [SmartPlatformController],
  providers: [SmartPlatformService],
  exports: [SmartPlatformService],
})
export class SmartPlatformModule {}
