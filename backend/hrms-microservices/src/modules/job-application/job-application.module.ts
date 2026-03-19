import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobApplication } from '../../database/entities/job-application.entity';
import { JobApplicationController } from './job-application.controller';
import { JobApplicationService } from './job-application.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobApplication])],
  controllers: [JobApplicationController],
  providers: [JobApplicationService],
  exports: [JobApplicationService],
})
export class JobApplicationModule {}
