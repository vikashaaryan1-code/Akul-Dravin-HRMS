import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DocumentRecordEntity } from '../../database/entities/document-record.entity';
import { DocumentCenterController } from './document-center.controller';
import { DocumentCenterService } from './document-center.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentRecordEntity])],
  controllers: [DocumentCenterController],
  providers: [DocumentCenterService, RolesGuard],
  exports: [DocumentCenterService],
})
export class DocumentCenterModule {}
