import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoInterviewController } from './video-interview.controller';
import { VideoInterviewService } from './video-interview.service';
import { VideoInterview } from '../../database/entities/video-interview.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VideoInterview])],
  controllers: [VideoInterviewController],
  providers: [VideoInterviewService],
  exports: [VideoInterviewService],
})
export class VideoInterviewModule {}
