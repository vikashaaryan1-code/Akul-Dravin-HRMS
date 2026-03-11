import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './certificate.entity';

@Injectable()
export class CertificateService {
  constructor(@InjectRepository(Certificate) private repo: Repository<Certificate>) {}
  async findAll(): Promise<Certificate[]> { return this.repo.find(); }
  async findOne(id: string): Promise<Certificate> { return this.repo.findOne({ where: { id } }); }
  async create(data: Partial<Certificate>): Promise<Certificate> { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Certificate>): Promise<Certificate> { await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string): Promise<void> { await this.repo.delete(id); }
}
