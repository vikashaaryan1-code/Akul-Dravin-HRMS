import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    const tenantId = TenantContext.getRequiredTenantId();
    const entity = this.repo.create({
      ...dto,
      tenantId,
    });
    try {
      return await this.repo.save(entity);
    } catch (error: any) {
      if (error.code === '23505' || error.message.includes('unique constraint')) {
        throw new ConflictException('An employee with this employeeCode or workEmail already exists.');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<EmployeeEntity> {
    const employee = await this.findOne(id);
    const updated = this.repo.merge(employee, dto);
    try {
      return await this.repo.save(updated);
    } catch (error: any) {
      if (error.code === '23505' || error.message.includes('unique constraint')) {
        throw new ConflictException('An employee with this employeeCode or workEmail already exists.');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.repo.remove(employee);
  }
}
