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
  /**
   * Consolidates multiple count queries into a single database round-trip using conditional aggregation.
   * Expected performance impact: Reduces database round-trips from 2 to 1.
   */
  async getStats(): Promise<any> {
    const stats = await this.repo.createQueryBuilder('candidate')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)", 'active')
      .getRawOne();

    return {
      total: parseInt(stats.total || '0', 10),
      active: parseInt(stats.active || '0', 10),
    };
  }
}
