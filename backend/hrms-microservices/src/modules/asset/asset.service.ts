import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../../database/entities/asset.entity';

@Injectable()
export class AssetService {
  constructor(@InjectRepository(Asset) private assetRepository: Repository<Asset>) {}

  async create(data: any) {
    const asset = this.assetRepository.create(data);
    return this.assetRepository.save(asset);
  }

  async findAll(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return this.assetRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.assetRepository.findOne({ where: { id } });
  }

  async assign(id: string, employeeId: string) {
    await this.assetRepository.update(id, { assignedTo: employeeId, status: 'assigned' });
    return this.findOne(id);
  }

  async unassign(id: string) {
    await this.assetRepository.update(id, { assignedTo: '', status: 'available' });
    return this.findOne(id);
  }

  async update(id: string, data: any) {
    await this.assetRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.assetRepository.delete(id);
  }
}
