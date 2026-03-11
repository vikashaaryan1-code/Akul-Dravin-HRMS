import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exit } from './exit.entity';

@Injectable()
export class ExitService {
  constructor(@InjectRepository(Exit) private exitRepository: Repository<Exit>) {}

  async findAll(): Promise<Exit[]> {
    return this.exitRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Exit> {
    return this.exitRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Exit>): Promise<Exit> {
    return this.exitRepository.save(this.exitRepository.create(data));
  }

  async update(id: string, data: Partial<Exit>): Promise<Exit> {
    await this.exitRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.exitRepository.delete(id);
  }

  async getStats(): Promise<any> {
    const total = await this.exitRepository.count();
    const pending = await this.exitRepository.count({ where: { status: 'pending' } });
    const completed = await this.exitRepository.count({ where: { status: 'completed' } });
    return { total, pending, completed };
  }
}
