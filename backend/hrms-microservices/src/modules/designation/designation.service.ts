import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignationEntity } from '../../database/entities/designation.entity';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';

@Injectable()
export class DesignationService {
  constructor(
    @InjectRepository(DesignationEntity)
    private readonly designationRepository: Repository<DesignationEntity>,
  ) {}

  findAll(): Promise<DesignationEntity[]> {
    return this.designationRepository.find({
      where: { isActive: true },
      order: { level: 'ASC', name: 'ASC' },
      relations: ['department'],
    });
  }

  findOne(id: string): Promise<DesignationEntity | null> {
    return this.designationRepository.findOne({
      where: { id },
      relations: ['department'],
    });
  }

  findByDepartment(departmentId: string): Promise<DesignationEntity[]> {
    return this.designationRepository.find({
      where: { departmentId, isActive: true },
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  async create(dto: CreateDesignationDto): Promise<DesignationEntity> {
    const designation = this.designationRepository.create(dto);
    return this.designationRepository.save(designation);
  }

  async update(id: string, dto: UpdateDesignationDto): Promise<DesignationEntity | null> {
    await this.designationRepository.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.designationRepository.update(id, { isActive: false });
  }
}
