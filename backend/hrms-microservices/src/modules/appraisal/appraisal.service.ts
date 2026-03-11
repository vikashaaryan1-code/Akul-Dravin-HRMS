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
    const total = await this.appraisalRepository.count();
    const completed = await this.appraisalRepository.count({ where: { status: 'completed' } });
    const draft = await this.appraisalRepository.count({ where: { status: 'draft' } });
    return { total, completed, draft };
  }
}
