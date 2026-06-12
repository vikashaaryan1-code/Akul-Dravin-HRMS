import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appraisal } from './appraisal.entity';

@Injectable()
export class AppraisalService {
  constructor(
    @InjectRepository(Appraisal)
    private appraisalRepository: Repository<Appraisal>,
  ) {}

  async findAll(): Promise<Appraisal[]> {
    return this.appraisalRepository.find({ order: { reviewDate: 'DESC' } });
  }

  async findOne(id: string): Promise<Appraisal> {
    return this.appraisalRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Appraisal>): Promise<Appraisal> {
    const appraisal = this.appraisalRepository.create(data);
    return this.appraisalRepository.save(appraisal);
  }

  async update(id: string, data: Partial<Appraisal>): Promise<Appraisal> {
    await this.appraisalRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.appraisalRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // Optimization: Use conditional aggregation to fetch all counts in a single query.
    // This reduces database roundtrips from 3 to 1.
    const stats = await this.appraisalRepository.createQueryBuilder('appraisal')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN appraisal.status = 'completed' THEN 1 ELSE 0 END)", 'completed')
      .addSelect("SUM(CASE WHEN appraisal.status = 'draft' THEN 1 ELSE 0 END)", 'draft')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      completed: parseInt(stats.completed, 10) || 0,
      draft: parseInt(stats.draft, 10) || 0,
    };
  }
}
