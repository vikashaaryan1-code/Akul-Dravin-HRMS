import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobApplication } from '../../database/entities/job-application.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { Employee } from '../employee/employee.entity';
import { Job } from '../../database/entities/job.entity';
import { JobApplicationController } from './job-application.controller';
import { JobApplicationService } from './job-application.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobApplication, UserEntity, Employee, Job])],
  controllers: [JobApplicationController],
  providers: [JobApplicationService],
  exports: [JobApplicationService],
})
export class JobApplicationModule {}
