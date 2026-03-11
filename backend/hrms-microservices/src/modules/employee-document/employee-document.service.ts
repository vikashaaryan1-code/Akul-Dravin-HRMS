import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeDocument } from '../../database/entities/employee-document.entity';

@Injectable()
export class EmployeeDocumentService {
  constructor(
    @InjectRepository(EmployeeDocument)
    private documentRepository: Repository<EmployeeDocument>,
  ) {}

  async create(data: any) {
    const document = this.documentRepository.create(data);
    return this.documentRepository.save(document);
  }

  async findAll(employeeId?: string) {
    const where = employeeId ? { employeeId } : {};
    return this.documentRepository.find({ where, relations: ['employee'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.documentRepository.findOne({ where: { id }, relations: ['employee'] });
  }

  async update(id: string, data: any) {
    await this.documentRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.documentRepository.delete(id);
  }
}
