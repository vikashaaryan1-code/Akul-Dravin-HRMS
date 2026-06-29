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
    // Optimized: Using a single query with conditional aggregation to reduce database round-trips from 3 to 1.
    const stats = await this.projectRepository
      .createQueryBuilder('project')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN project.status = 'active' THEN 1 ELSE 0 END)", 'active')
      .addSelect("SUM(CASE WHEN project.status = 'completed' THEN 1 ELSE 0 END)", 'completed')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      active: parseInt(stats.active, 10) || 0,
      completed: parseInt(stats.completed, 10) || 0,
    };
  }
}
