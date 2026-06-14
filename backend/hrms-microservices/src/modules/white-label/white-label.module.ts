import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhiteLabelController } from './white-label.controller';
import { WhiteLabelService } from './white-label.service';
import { WhiteLabelBrandingService } from './white-label-branding.service';
import { WhiteLabelConfigEntity } from '../../database/entities/white-label-config.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([WhiteLabelConfigEntity])],
  controllers: [WhiteLabelController],
  providers: [WhiteLabelService, WhiteLabelBrandingService, RolesGuard],
  exports: [WhiteLabelService, WhiteLabelBrandingService],
})
export class WhiteLabelModule {}
