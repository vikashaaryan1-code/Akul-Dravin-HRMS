import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../database/entities/role.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';

@Injectable()
export class PermissionControlService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async getRoles(tenantId?: string) {
    return this.roleRepository.find({
      where: tenantId ? { tenantId } : {},
      relations: ['permissions'],
    });
  }

  async getPermissions() {
    return this.permissionRepository.find();
  }

  async createRole(name: string, tenantId: string, permissionIds: string[]) {
    const permissions = await this.permissionRepository.findByIds(permissionIds);
    const role = this.roleRepository.create({
      name,
      tenantId,
      permissions,
      isSystemRole: false,
    });
    return this.roleRepository.save(role);
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.roleRepository.findOne({ where: { id: roleId }, relations: ['permissions'] });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = await this.permissionRepository.findByIds(permissionIds);
    role.permissions = permissions;
    return this.roleRepository.save(role);
  }

  /** Get permission-change audit log (stub — replace with AuditEntity when wired) */
  async getAudits(tenantId?: string): Promise<unknown[]> {
    // TODO: wire to a dedicated AuditLogEntity when audit persistence is implemented
    return [];
  }

  /** Update a role's metadata (name, isSystemRole) */
  async updateRole(roleId: string, payload: { name?: string; isSystemRole?: boolean }): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    Object.assign(role, payload);
    return this.roleRepository.save(role);
  }
}
