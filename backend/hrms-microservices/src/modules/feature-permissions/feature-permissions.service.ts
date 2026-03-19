import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeaturePermission } from './feature-permission.entity';

@Injectable()
export class FeaturePermissionsService {
  constructor(
    @InjectRepository(FeaturePermission)
    private readonly featurePermissionRepository: Repository<FeaturePermission>,
  ) {}

  async findAll() {
    return this.featurePermissionRepository.find({ order: { role: 'ASC', feature: 'ASC' } });
  }

  async findByRole(role: string) {
    return this.featurePermissionRepository.find({ where: { role } });
  }

  async upsert(role: string, feature: string, permissions: Partial<FeaturePermission>) {
    const existing = await this.featurePermissionRepository.findOne({ where: { role, feature } });
    
    if (existing) {
      await this.featurePermissionRepository.update(existing.id, permissions);
      return this.featurePermissionRepository.findOne({ where: { id: existing.id } });
    }
    
    const newPermission = this.featurePermissionRepository.create({ role, feature, ...permissions });
    return this.featurePermissionRepository.save(newPermission);
  }

  async bulkUpsert(permissions: Array<{ role: string; feature: string; canView: boolean; canEdit: boolean; canDelete: boolean }>) {
    const results = [];
    for (const perm of permissions) {
      const result = await this.upsert(perm.role, perm.feature, perm);
      results.push(result);
    }
    return results;
  }

  async delete(id: string) {
    return this.featurePermissionRepository.delete(id);
  }
}
