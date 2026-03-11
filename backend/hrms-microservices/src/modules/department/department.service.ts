import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from '../../database/entities/department.entity';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  findAll(): Promise<DepartmentEntity[]> {
    return this.departmentRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      relations: ['company'],
    });
  }

  findOne(id: string): Promise<DepartmentEntity | null> {
    return this.departmentRepository.findOne({
      where: { id },
      relations: ['company'],
    });
  }

  findByCompany(companyId: string): Promise<DepartmentEntity[]> {
    return this.departmentRepository.find({
      where: { companyId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateDepartmentDto): Promise<DepartmentEntity> {
    const department = this.departmentRepository.create(dto);
    return this.departmentRepository.save(department);
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<DepartmentEntity | null> {
    await this.departmentRepository.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.departmentRepository.update(id, { isActive: false });
  }
}
