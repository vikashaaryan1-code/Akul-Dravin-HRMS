import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class EmployeeService {
  private get repo() {
    return TenantContext.getRepository(EmployeeEntity);
  }

  async findAll(): Promise<EmployeeEntity[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<EmployeeEntity> {
    const employee = await this.repo.findOne({
      where: { id },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeEntity> {
    const tenantId = TenantContext.getTenantId();
    const entity = this.repo.create({
      ...dto,
      tenantId,
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<EmployeeEntity> {
    const employee = await this.findOne(id);
    const updated = this.repo.merge(employee, dto);
    return this.repo.save(updated);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.repo.remove(employee);
  }
}
