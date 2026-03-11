import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../database/entities/role.entity';

@Injectable()
export class RoleService {
  constructor(@InjectRepository(Role) private roleRepository: Repository<Role>) {}

  async create(data: any) {
    const role = this.roleRepository.create(data);
    return this.roleRepository.save(role);
  }

  async findAll() {
    return this.roleRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.roleRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.roleRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.roleRepository.delete(id);
  }
}
