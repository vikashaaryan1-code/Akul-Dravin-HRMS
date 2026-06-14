import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartPlatformController } from './smart-platform.controller';
import { SmartPlatformService } from './smart-platform.service';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { PerformanceEntity } from '../../database/entities/performance.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceEntity, EmployeeEntity])],
  controllers: [SmartPlatformController, LmsController],
  providers: [SmartPlatformService, LmsService],
  exports: [SmartPlatformService, LmsService],
})
export class SmartPlatformModule {}
