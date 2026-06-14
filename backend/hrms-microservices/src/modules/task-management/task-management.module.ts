import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskManagementController } from './task-management.controller';
import { TaskManagementService } from './task-management.service';
import { TaskEntity } from '../../database/entities/task.entity';
import { ProjectEntity } from '../../database/entities/project.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DomainEventModule } from '../../common/domain-events/domain-event.module';

/**
 * TaskManagementModule
 *
 * Wires task CRUD to the platform's cross-cutting concerns via DomainEventModule.
 *
 * After Commit 3, downstream propagation is no longer wired directly here.
 * DomainEventModule owns: ActivityFeed, Search, Notification, Audit wiring.
 * TaskManagementService emits via DomainEventBus → handlers route by severity.
 *
 * Propagation contract: task.assignment.created
 *   - audit.entry.written         (critical)
 *   - activity.feed.logged        (critical)
 *   - search.document.indexed     (eventual)
 *   - notification.dispatched     (best_effort)
 *
 * Verified by: test/governance/domain-contracts.enforcement.spec.ts
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity, ProjectEntity, EmployeeEntity]),
    DomainEventModule,   // owns all downstream propagation routing
  ],
  controllers: [TaskManagementController],
  providers:   [TaskManagementService, RolesGuard],
  exports:     [TaskManagementService],
})
export class TaskManagementModule {}
