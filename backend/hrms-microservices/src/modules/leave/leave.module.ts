import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { LeaveRequest } from '../../database/entities/leave-request.entity';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveTypeEntity, LeaveRequest])],
  controllers: [LeaveController],
  providers: [LeaveService, RolesGuard],
  exports: [LeaveService],
})
export class LeaveModule {}
