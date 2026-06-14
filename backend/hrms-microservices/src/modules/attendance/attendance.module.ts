import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { QrAttendanceService } from './qr-attendance.service';
import { ShiftEntity } from '../../database/entities/shift.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity, ShiftEntity])],
  controllers: [AttendanceController],
  providers: [AttendanceService, QrAttendanceService, RolesGuard],
  exports: [AttendanceService, QrAttendanceService],
})
export class AttendanceModule {}
