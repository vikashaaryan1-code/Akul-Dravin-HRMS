import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../database/entities/task.entity';

@Injectable()
export class TaskService {
  constructor(@InjectRepository(Task) private taskRepository: Repository<Task>) {}

  async create(data: any) {
    const task = this.taskRepository.create(data);
    return this.taskRepository.save(task);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.status) where.status = filters.status;
    return this.taskRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.taskRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.taskRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.taskRepository.delete(id);
  }
}
