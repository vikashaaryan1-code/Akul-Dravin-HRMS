import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Project | null> {
    return this.projectRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.projectRepository.create(data);
    return this.projectRepository.save(project);
  }

  async update(id: string, data: Partial<Project>): Promise<Project | null> {
    await this.projectRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.projectRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // Optimization: Consolidate multiple count queries into a single database roundtrip using conditional aggregation.
    // This reduces database load and network latency.
    const stats = await this.projectRepository.createQueryBuilder('project')
      .select('COUNT(*)', 'total')
      .addSelect("COUNT(*) FILTER (WHERE project.status = 'active')", 'active')
      .addSelect("COUNT(*) FILTER (WHERE project.status = 'completed')", 'completed')
      .getRawOne();

    return {
      total: parseInt(stats.total || '0', 10),
      active: parseInt(stats.active || '0', 10),
      completed: parseInt(stats.completed || '0', 10),
    };
  }
}
