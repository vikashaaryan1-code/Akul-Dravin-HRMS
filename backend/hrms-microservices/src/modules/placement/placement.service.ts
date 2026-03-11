import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Placement } from './placement.entity';

@Injectable()
export class PlacementService {
  constructor(@InjectRepository(Placement) private repo: Repository<Placement>) {}
  async findAll(): Promise<Placement[]> { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  async findOne(id: string): Promise<Placement | null> { return this.repo.findOne({ where: { id } }); }
  async create(data: Partial<Placement>): Promise<Placement> { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Placement>): Promise<Placement | null> { await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string): Promise<void> { await this.repo.delete(id); }
  async getStats(): Promise<any> {
    const total = await this.repo.count();
    const active = await this.repo.count({ where: { status: 'active' } });
    return { total, active };
  }
}
