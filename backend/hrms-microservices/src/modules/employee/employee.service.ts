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
    if (tenantId) where.companyId = tenantId;
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
      // Using companyId as the entity property name for filtering.
      queryBuilder.where('employee.companyId = :tenantId', { tenantId });
    }

    // Optimization: Using PostgreSQL FILTER clause to perform all counts in a single database round-trip.
    // This reduces the number of queries from 4 to 1 and avoids multiple full/index scans on the same table.
    const result = await queryBuilder
      .select('COUNT(*)', 'total')
      .addSelect("COUNT(*) FILTER (WHERE status = 'active')", 'active')
      .addSelect("COUNT(*) FILTER (WHERE status = 'inactive')", 'inactive')
      .addSelect("COUNT(*) FILTER (WHERE status = 'on_leave')", 'onLeave')
      .getRawOne();

    return {
      total: parseInt(result.total, 10) || 0,
      active: parseInt(result.active, 10) || 0,
      inactive: parseInt(result.inactive, 10) || 0,
      onLeave: parseInt(result.onLeave, 10) || 0,
    };
  }
}
