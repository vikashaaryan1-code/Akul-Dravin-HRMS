import { Module } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';
import { SmartPlatformModule } from '../smart-platform/smart-platform.module';
import { PublicSiteController } from './public-site.controller';
import { PublicSiteService } from './public-site.service';

@Module({
  imports: [CrmModule, SmartPlatformModule],
  controllers: [PublicSiteController],
  providers: [PublicSiteService],
})
export class PublicSiteModule {}
