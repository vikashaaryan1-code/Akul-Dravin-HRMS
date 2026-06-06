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
    const query = this.employeeRepository.createQueryBuilder('employee');

    if (tenantId) {
      query.where('employee.tenantId = :tenantId', { tenantId });
    }

    // Optimization: Consolidate multiple count queries into a single database roundtrip using conditional aggregation.
    // This reduces database load and network latency.
    const stats = await query
      .select('COUNT(*)', 'total')
      .addSelect("COUNT(*) FILTER (WHERE employee.status = 'active')", 'active')
      .addSelect("COUNT(*) FILTER (WHERE employee.status = 'inactive')", 'inactive')
      .addSelect("COUNT(*) FILTER (WHERE employee.status = 'on_leave')", 'onLeave')
      .getRawOne();

    return {
      total: parseInt(stats.total || '0', 10),
      active: parseInt(stats.active || '0', 10),
      inactive: parseInt(stats.inactive || '0', 10),
      onLeave: parseInt(stats.onLeave || '0', 10),
    };
  }
}
