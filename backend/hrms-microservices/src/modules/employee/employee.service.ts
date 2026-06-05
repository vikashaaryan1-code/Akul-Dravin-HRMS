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

  async findAll(companyId?: string): Promise<Employee[]> {
    const where: any = {};
    if (companyId) where.companyId = companyId;
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
   * Optimized getStats using a single query with conditional aggregation (PostgreSQL FILTER clause).
   * Reduces database roundtrips from 4 to 1.
   * Also corrected organizational filter from 'tenantId' to 'companyId'.
   */
  async getStats(companyId?: string): Promise<any> {
    const query = this.employeeRepository.createQueryBuilder('employee')
      .select('COUNT(*)', 'total')
      .addSelect("COUNT(*) FILTER (WHERE status = 'active')", 'active')
      .addSelect("COUNT(*) FILTER (WHERE status = 'inactive')", 'inactive')
      .addSelect("COUNT(*) FILTER (WHERE status = 'on_leave')", 'onLeave');

    if (companyId) {
      query.where('employee.companyId = :companyId', { companyId });
    }

    const result = await query.getRawOne();

    return {
      total: parseInt(result.total, 10) || 0,
      active: parseInt(result.active, 10) || 0,
      inactive: parseInt(result.inactive, 10) || 0,
      onLeave: parseInt(result.onLeave, 10) || 0,
    };
  }
}
