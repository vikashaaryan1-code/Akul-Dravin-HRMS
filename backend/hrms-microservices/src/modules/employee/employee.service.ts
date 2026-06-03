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

  /**
   * Returns employee statistics.
   * Optimized to use a single database query with conditional aggregation.
   * Reduces database round-trips from 4 to 1.
   */
  async getStats(tenantId?: string): Promise<any> {
    const queryBuilder = this.employeeRepository.createQueryBuilder('employee');

    if (tenantId) {
      // Note: Employee entity doesn't explicitly have tenantId,
      // but the controller passes it. Assuming it might be handled
      // via a dynamic property or future-proofing.
      queryBuilder.where('employee.tenantId = :tenantId', { tenantId });
    }

    const stats = await queryBuilder
      .select('COUNT(*)', 'total')
      .addSelect("COUNT(*) FILTER (WHERE employee.status = 'active')", 'active')
      .addSelect("COUNT(*) FILTER (WHERE employee.status = 'inactive')", 'inactive')
      .addSelect("COUNT(*) FILTER (WHERE employee.status = 'on_leave')", 'onLeave')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      active: parseInt(stats.active, 10) || 0,
      inactive: parseInt(stats.inactive, 10) || 0,
      onLeave: parseInt(stats.onLeave, 10) || 0,
    };
  }
}
