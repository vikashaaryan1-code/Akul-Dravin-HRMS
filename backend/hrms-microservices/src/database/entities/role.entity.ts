import { Column, Entity, Index, ManyToMany, JoinTable } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { PermissionEntity } from './permission.entity';

@Entity({ name: 'roles' })
export class RoleEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_system_role', type: 'boolean', default: false })
  isSystemRole!: boolean;

  @ManyToMany(() => PermissionEntity)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions!: PermissionEntity[];
}
