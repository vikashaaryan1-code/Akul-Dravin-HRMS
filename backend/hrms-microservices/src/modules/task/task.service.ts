import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../database/entities/task.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    private emailService: EmailService,
  ) {}

  async create(data: any) {
    const task = this.taskRepository.create(data);
    const saved = await this.taskRepository.save(task);

    // Send email notification to assigned user
    if (data.assignedTo) {
      const user = await this.userRepository.findOne({ where: { id: data.assignedTo } });
      if (user) {
        const dueDate = data.dueDate ? new Date(data.dueDate).toDateString() : 'Not set';
        await this.emailService.sendTaskAssigned(user.email, user.fullName, data.title, dueDate);
      }
    }

    return saved;
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.status) where.status = filters.status;
    if (filters.tenantId) where.tenantId = filters.tenantId;
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
