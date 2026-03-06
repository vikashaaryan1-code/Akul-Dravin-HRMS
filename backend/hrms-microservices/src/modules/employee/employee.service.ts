import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../../database/entities/employee.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  findAll(): Promise<EmployeeEntity[]> {
    return this.employeeRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<EmployeeEntity | null> {
    return this.employeeRepository.findOne({ where: { id } });
  }

  create(payload: Partial<EmployeeEntity>): Promise<EmployeeEntity> {
    const entity = this.employeeRepository.create(payload);
    return this.employeeRepository.save(entity);
  }

  async update(id: string, payload: Partial<EmployeeEntity>): Promise<EmployeeEntity | null> {
    await this.employeeRepository.update(id, payload);
    return this.findOne(id);
  }
}
