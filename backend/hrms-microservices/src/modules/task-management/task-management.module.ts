import { Module } from '@nestjs/common';
import { TaskManagementController } from './task-management.controller';
import { TaskManagementService } from './task-management.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [TaskManagementController],
  providers: [TaskManagementService, RolesGuard],
  exports: [TaskManagementService],
})
export class TaskManagementModule {}
