import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { BulkDataEngineService } from './bulk-data-engine.service';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { PayrollItemEntity } from '../../database/entities/payroll-item.entity';
import { DomainEventService } from '../../common/events/domain-event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeEntity, AttendanceEntity, PayrollItemEntity]),
    BullModule.registerQueue({ name: 'domain-events' }),
  ],
  providers: [BulkDataEngineService, DomainEventService],
  exports: [BulkDataEngineService],
})
export class DataOpsModule {}
