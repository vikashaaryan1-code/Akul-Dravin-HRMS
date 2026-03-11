import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './skill.entity';

@Injectable()
export class SkillService {
  constructor(@InjectRepository(Skill) private repo: Repository<Skill>) {}
  async findAll(): Promise<Skill[]> { return this.repo.find(); }
  async findOne(id: string): Promise<Skill | null> { return this.repo.findOne({ where: { id } }); }
  async create(data: Partial<Skill>): Promise<Skill> { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Skill>): Promise<Skill | null> { await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string): Promise<void> { await this.repo.delete(id); }
}
