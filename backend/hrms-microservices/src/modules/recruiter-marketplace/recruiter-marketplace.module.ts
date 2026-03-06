import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruiterMarketplaceController } from './recruiter-marketplace.controller';
import { RecruiterMarketplaceService } from './recruiter-marketplace.service';
import { RecruiterProfileEntity } from '../../database/entities/recruiter-profile.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([RecruiterProfileEntity])],
  controllers: [RecruiterMarketplaceController],
  providers: [RecruiterMarketplaceService, RolesGuard],
  exports: [RecruiterMarketplaceService],
})
export class RecruiterMarketplaceModule {}
