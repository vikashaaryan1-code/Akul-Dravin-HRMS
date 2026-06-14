import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { LmsController } from './lms.controller';

@Module({
  controllers: [LmsController],
  providers: [CourseService],
  exports: [CourseService],
})
export class LmsModule {}
