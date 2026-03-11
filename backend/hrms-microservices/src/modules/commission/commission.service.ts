import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from './commission.entity';

@Injectable()
export class CommissionService {
  constructor(@InjectRepository(Commission) private repo: Repository<Commission>) {}
  async findAll(): Promise<Commission[]> { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  async findOne(id: string): Promise<Commission> { return this.repo.findOne({ where: { id } }); }
  async create(data: Partial<Commission>): Promise<Commission> { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Commission>): Promise<Commission> { await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string): Promise<void> { await this.repo.delete(id); }
  async getStats(): Promise<any> {
    const total = await this.repo.count();
    const pending = await this.repo.count({ where: { status: 'pending' } });
    const paid = await this.repo.count({ where: { status: 'paid' } });
    return { total, pending, paid };
  }
}
