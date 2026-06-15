import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async findAll(tenantId?: string): Promise<Employee[]> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return this.employeeRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Employee> {
    return this.employeeRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Employee>): Promise<Employee> {
    const employee = this.employeeRepository.create(data);
    return this.employeeRepository.save(employee);
  }

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    await this.employeeRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.employeeRepository.delete(id);
  }

  async getStats(tenantId?: string): Promise<any> {
    const queryBuilder = this.employeeRepository.createQueryBuilder('employee');

    if (tenantId) {
      // Using 'tenantId' as the property name for the query as it seems to be
      // the convention used in this codebase despite the entity field name.
      queryBuilder.where('employee.tenantId = :tenantId', { tenantId });
    }

    // Consolidated 4 queries into 1 using conditional aggregation.
    // Performance impact: Reduces database roundtrips by 75% for this method.
    const stats = await queryBuilder
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN employee.status = 'active' THEN 1 ELSE 0 END)", 'active')
      .addSelect("SUM(CASE WHEN employee.status = 'inactive' THEN 1 ELSE 0 END)", 'inactive')
      .addSelect("SUM(CASE WHEN employee.status = 'on_leave' THEN 1 ELSE 0 END)", 'onLeave')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      active: parseInt(stats.active, 10) || 0,
      inactive: parseInt(stats.inactive, 10) || 0,
      onLeave: parseInt(stats.onLeave, 10) || 0,
    };
  }
}
