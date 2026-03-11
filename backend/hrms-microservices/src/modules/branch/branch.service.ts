import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../../database/entities/branch.entity';

@Injectable()
export class BranchService {
  constructor(@InjectRepository(Branch) private branchRepository: Repository<Branch>) {}

  async create(data: any) {
    const branch = this.branchRepository.create(data);
    return this.branchRepository.save(branch);
  }

  async findAll(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return this.branchRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.branchRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.branchRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.branchRepository.delete(id);
  }
}
