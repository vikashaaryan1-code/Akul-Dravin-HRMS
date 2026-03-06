import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MarketplaceListingEntity } from '../../database/entities/marketplace-listing.entity';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceListingEntity])],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, RolesGuard],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
