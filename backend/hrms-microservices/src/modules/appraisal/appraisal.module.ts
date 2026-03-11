import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppraisalController } from './appraisal.controller';
import { AppraisalService } from './appraisal.service';
import { Appraisal } from './appraisal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appraisal])],
  controllers: [AppraisalController],
  providers: [AppraisalService],
  exports: [AppraisalService],
})
export class AppraisalModule {}
