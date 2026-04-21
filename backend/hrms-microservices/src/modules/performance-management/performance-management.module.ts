import { Module } from '@nestjs/common';
import { PerformanceManagementController } from './performance-management.controller';
import { PerformanceManagementService } from './performance-management.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { TaskEntity } from '../../database/entities/task.entity';
import { PerformanceEntity } from '../../database/entities/performance.entity';
import { PolicyEngineModule } from '../policy-engine/policy-engine.module';
import { CareerGrowthModule } from '../career-growth/career-growth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeEntity, AttendanceEntity, TaskEntity, PerformanceEntity]),
    PolicyEngineModule,
    CareerGrowthModule,
  ],
  controllers: [PerformanceManagementController],
  providers: [PerformanceManagementService, RolesGuard],
  exports: [PerformanceManagementService],
})
export class PerformanceManagementModule {}
