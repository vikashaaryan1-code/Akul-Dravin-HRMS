import { Injectable, Logger } from '@nestjs/common';
import { TaskEntity } from '../../database/entities/task.entity';
import { ProjectEntity } from '../../database/entities/project.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { DomainEventBus } from '../../common/domain-events/domain-event-bus';
import { TASK_EVENTS } from '../../common/governance/events/domain-events';

/**
 * TaskManagementService — GOVERNED DOMAIN EMITTER
 *
 * After Commit 3, this service is no longer persistence-only.
 * Every mutation now participates in the domain event pipeline:
 *
 *   save → DomainEventBus.emit('task.assignment.created')
 *              ↓
 *        AuditHandler     (critical  — blocks on failure)
 *        ActivityHandler  (critical  — blocks on failure)
 *        SearchHandler    (eventual  — warns on failure)
 *        NotificationHandler (best_effort — fire-and-forget)
 *
 * Sequencing invariant: repository save always precedes event emission.
 * If save fails → no events emitted.
 * If critical propagation fails → error surfaces to caller (HTTP 5xx).
 * If eventual/best_effort fails → operation completes, logged.
 *
 * Governance contract: task.assignment.created
 * Verified by: domain-contracts.enforcement.spec.ts
 * Enforced by: CI (EventBusSpy.assertSatisfiesContract)
 */
@Injectable()
export class TaskManagementService {
  private readonly logger = new Logger(TaskManagementService.name);

  constructor(private readonly domainEventBus: DomainEventBus) {}

  private get taskRepo() {
    return TenantContext.getRepository(TaskEntity);
  }

  private get projectRepo() {
    return TenantContext.getRepository(ProjectEntity);
  }

  async getTasks(): Promise<TaskEntity[]> {
    return this.taskRepo.find({
      relations: ['assignee', 'project'],
      order: { dueDate: 'ASC' },
    });
  }

  async getProjects(): Promise<ProjectEntity[]> {
    return this.projectRepo.find({
      relations: ['owner'],
      order: { completionRate: 'DESC' },
    });
  }

  /**
   * createTask — governed domain mutation.
   *
   * Step 1: Resolve tenant context (throws if missing — governance boundary).
   * Step 2: Save task to database.
   * Step 3: Emit task.assignment.created to DomainEventBus.
   *   - Critical propagation (audit, activity) blocks mutation completion.
   *   - Eventual propagation (search) runs concurrently, warns on failure.
   *   - Best-effort (notifications) fires and forgets.
   *
   * @param payload  Task fields (title, description, assigneeId, etc.)
   * @param actorId  ID of the user creating the task (for audit/activity attribution).
   * @param correlationId  Request correlation ID for distributed trace threading.
   */
  async createTask(
    payload: Partial<TaskEntity>,
    actorId?: string,
    correlationId?: string,
  ): Promise<TaskEntity> {
    const tenantId = payload.tenantId ?? TenantContext.getRequiredTenantId();

    // Step 1: Persist — event emission only happens after successful save
    const task = await this.taskRepo.save(
      this.taskRepo.create({ ...payload, tenantId }),
    );

    // Step 2: Emit domain event — propagates to all registered handlers
    // by severity order (critical → eventual → best_effort)
    try {
      await this.domainEventBus.emit(
        TASK_EVENTS.CREATED,
        tenantId,
        {
          entityId:    task.id,
          title:       task.title,
          description: task.description ?? undefined,
          status:      task.status,
          priority:    task.priority,
          assigneeId:  task.assigneeId ?? undefined,
          projectId:   task.projectId ?? undefined,
          dueDate:     task.dueDate ?? undefined,
        },
        {
          actorId,
          correlationId,
          aggregateId:   task.id,
          aggregateType: 'Task',
        },
      );
    } catch (err) {
      // A critical handler (audit/activity) failed.
      // Log with full context — the task IS saved but propagation failed.
      // The error surfaces to the caller as HTTP 500.
      this.logger.error(
        `TaskManagementService.createTask: critical propagation failed ` +
          `[taskId=${task.id}] [tenantId=${tenantId}] [correlationId=${correlationId ?? 'none'}]: ${String(err)}`,
      );
      throw err;
    }

    return task;
  }

  /**
   * updateTask — governed domain mutation.
   *
   * Emits task.assignment.updated after a successful field update.
   * Status transitions to 'completed' additionally emit task.assignment.completed.
   */
  async updateTask(
    id: string,
    payload: Partial<TaskEntity>,
    actorId?: string,
    correlationId?: string,
  ): Promise<TaskEntity | null> {
    const tenantId = TenantContext.getRequiredTenantId();

    await this.taskRepo.update(id, payload);
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignee', 'project'],
    });

    if (!task) return null;

    const eventName =
      payload.status === 'completed'
        ? TASK_EVENTS.COMPLETED
        : TASK_EVENTS.UPDATED;

    try {
      await this.domainEventBus.emit(
        eventName,
        tenantId,
        {
          entityId:    task.id,
          title:       task.title,
          status:      task.status,
          priority:    task.priority,
          assigneeId:  task.assigneeId ?? undefined,
          projectId:   task.projectId ?? undefined,
          completedAt: task.completedAt?.toISOString(),
        },
        {
          actorId,
          correlationId,
          aggregateId:   task.id,
          aggregateType: 'Task',
        },
      );
    } catch (err) {
      this.logger.error(
        `TaskManagementService.updateTask: critical propagation failed ` +
          `[taskId=${id}] [event=${eventName}] [correlationId=${correlationId ?? 'none'}]: ${String(err)}`,
      );
      throw err;
    }

    return task;
  }
}


