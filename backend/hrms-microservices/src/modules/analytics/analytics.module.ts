import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../../database/entities/employee.entity';
import { Attendance } from '../../database/entities/attendance.entity';
import { LeaveRequest } from '../../database/entities/leave-request.entity';
import { Job } from '../../database/entities/job.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Attendance, LeaveRequest, Job])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
