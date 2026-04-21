import { Injectable } from '@nestjs/common';
import { TaskEntity } from '../../database/entities/task.entity';
import { ProjectEntity } from '../../database/entities/project.entity';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class TaskManagementService {
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

  async createTask(payload: Partial<TaskEntity>): Promise<TaskEntity> {
    const tenantId = payload.tenantId || TenantContext.getRequiredTenantId();
    const task = this.taskRepo.create({ ...payload, tenantId });
    return this.taskRepo.save(task);
  }

  async updateTask(id: string, payload: Partial<TaskEntity>): Promise<TaskEntity | null> {
    await this.taskRepo.update(id, payload);
    return this.taskRepo.findOne({ where: { id }, relations: ['assignee', 'project'] });
  }
}

