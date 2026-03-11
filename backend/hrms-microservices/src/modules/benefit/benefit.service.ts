import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Benefit } from './benefit.entity';

@Injectable()
export class BenefitService {
  constructor(@InjectRepository(Benefit) private repo: Repository<Benefit>) {}
  async findAll(): Promise<Benefit[]> { return this.repo.find(); }
  async findOne(id: string): Promise<Benefit> { return this.repo.findOne({ where: { id } }); }
  async create(data: Partial<Benefit>): Promise<Benefit> { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Benefit>): Promise<Benefit> { await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string): Promise<void> { await this.repo.delete(id); }
}
