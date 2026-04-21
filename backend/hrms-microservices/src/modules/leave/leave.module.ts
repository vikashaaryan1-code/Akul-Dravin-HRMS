import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { LeaveRequestEntity } from '../../database/entities/leave-request.entity';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveTypeEntity, LeaveRequestEntity]),
    AttendanceModule,
  ],
  controllers: [LeaveController],
  providers: [LeaveService, RolesGuard],
  exports: [LeaveService],
})
export class LeaveModule {}
