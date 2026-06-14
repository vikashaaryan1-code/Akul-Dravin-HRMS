import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { LeaveRequestEntity } from '../../database/entities/leave-request.entity';
import { LeaveBalanceEntity } from '../../database/entities/leave-balance.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { LeaveBalanceService } from './leave-balance.service';
import { AttendanceModule } from '../attendance/attendance.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditLogModule } from '../../common/audit/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaveTypeEntity,
      LeaveRequestEntity,
      LeaveBalanceEntity,
      EmployeeEntity,
    ]),
    AttendanceModule,
    NotificationModule,
    AuditLogModule,
  ],
  controllers: [LeaveController],
  providers:   [LeaveService, LeaveBalanceService, RolesGuard],
  exports:     [LeaveService, LeaveBalanceService],
})
export class LeaveModule {}

