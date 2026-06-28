import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Client> {
    return this.clientRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Client>): Promise<Client> {
    const client = this.clientRepository.create(data);
    return this.clientRepository.save(client);
  }

  async update(id: string, data: Partial<Client>): Promise<Client> {
    await this.clientRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.clientRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // Optimization: Use a single query with conditional aggregation to reduce database round-trips from 3 to 1.
    const stats = await this.clientRepository
      .createQueryBuilder('client')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN client.status = 'active' THEN 1 ELSE 0 END)", 'active')
      .addSelect("SUM(CASE WHEN client.status = 'inactive' THEN 1 ELSE 0 END)", 'inactive')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      active: parseInt(stats.active, 10) || 0,
      inactive: parseInt(stats.inactive, 10) || 0,
    };
  }
}
