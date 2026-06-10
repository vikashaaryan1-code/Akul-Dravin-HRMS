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
    const query = this.employeeRepository.createQueryBuilder('employee')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN employee.status = 'active' THEN 1 ELSE 0 END)", 'active')
      .addSelect("SUM(CASE WHEN employee.status = 'inactive' THEN 1 ELSE 0 END)", 'inactive')
      .addSelect("SUM(CASE WHEN employee.status = 'on_leave' THEN 1 ELSE 0 END)", 'onLeave');

    if (tenantId) {
      // Note: Although the entity uses companyId, the service uses tenantId in queries.
      // We'll stick to 'tenantId' for consistency with existing service logic.
      // Using dynamic property access to avoid TS errors if tenantId is missing from entity type
      // but present in database (as hinted by existing code).
      query.where('employee.tenantId = :tenantId', { tenantId });
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
