import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './candidate.entity';

@Injectable()
export class CandidateService {
  constructor(@InjectRepository(Candidate) private repo: Repository<Candidate>) {}
  async findAll(): Promise<Candidate[]> { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  async findOne(id: string): Promise<Candidate> { return this.repo.findOne({ where: { id } }); }
  async create(data: Partial<Candidate>): Promise<Candidate> { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Candidate>): Promise<Candidate> { await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string): Promise<void> { await this.repo.delete(id); }
  async getStats(): Promise<any> { const total = await this.repo.count(); const active = await this.repo.count({ where: { status: 'active' } }); return { total, active }; }
}
