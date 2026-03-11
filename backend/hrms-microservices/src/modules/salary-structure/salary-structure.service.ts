import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryStructure } from './salary-structure.entity';

@Injectable()
export class SalaryStructureService {
  constructor(
    @InjectRepository(SalaryStructure)
    private salaryStructureRepository: Repository<SalaryStructure>,
  ) {}

  async findAll(): Promise<SalaryStructure[]> {
    return this.salaryStructureRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<SalaryStructure | null> {
    return this.salaryStructureRepository.findOne({ where: { id } });
  }

  async findByEmployee(employeeId: string): Promise<SalaryStructure[]> {
    return this.salaryStructureRepository.find({ where: { employeeId }, order: { effectiveFrom: 'DESC' } });
  }

  async create(data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    const structure = this.salaryStructureRepository.create(data);
    return this.salaryStructureRepository.save(structure);
  }

  async update(id: string, data: Partial<SalaryStructure>): Promise<SalaryStructure | null> {
    await this.salaryStructureRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.salaryStructureRepository.delete(id);
  }
}
