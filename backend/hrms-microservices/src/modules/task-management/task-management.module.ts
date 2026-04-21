import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskManagementController } from './task-management.controller';
import { TaskManagementService } from './task-management.service';
import { TaskEntity } from '../../database/entities/task.entity';
import { ProjectEntity } from '../../database/entities/project.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, ProjectEntity])],
  controllers: [TaskManagementController],
  providers: [TaskManagementService, RolesGuard],
  exports: [TaskManagementService],
})
export class TaskManagementModule {}
