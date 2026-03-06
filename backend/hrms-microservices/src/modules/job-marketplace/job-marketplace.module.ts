import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobMarketplaceController } from './job-marketplace.controller';
import { JobMarketplaceService } from './job-marketplace.service';
import { MarketplaceJobEntity } from '../../database/entities/marketplace-job.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceJobEntity])],
  controllers: [JobMarketplaceController],
  providers: [JobMarketplaceService, RolesGuard],
  exports: [JobMarketplaceService],
})
export class JobMarketplaceModule {}
