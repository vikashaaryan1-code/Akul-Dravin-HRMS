import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhiteLabelController } from './white-label.controller';
import { WhiteLabelService } from './white-label.service';
import { WhiteLabelPartner } from '../../database/entities/white-label-partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WhiteLabelPartner])],
  controllers: [WhiteLabelController],
  providers: [WhiteLabelService],
  exports: [WhiteLabelService],
})
export class WhiteLabelModule {}
