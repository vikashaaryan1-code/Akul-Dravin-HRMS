import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from '../../database/entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {}

  findAll(): Promise<CompanyEntity[]> {
    return this.companyRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<CompanyEntity | null> {
    return this.companyRepository.findOne({ where: { id } });
  }

  create(payload: Partial<CompanyEntity>): Promise<CompanyEntity> {
    const entity = this.companyRepository.create(payload);
    return this.companyRepository.save(entity);
  }

  async update(id: string, payload: Partial<CompanyEntity>): Promise<CompanyEntity | null> {
    await this.companyRepository.update(id, payload);
    return this.findOne(id);
  }
}
