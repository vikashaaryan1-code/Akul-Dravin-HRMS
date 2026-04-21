import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'users' })
export class UserEntity extends TenantScopedEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 190 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 140 })
  fullName!: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role?: RoleEntity;

  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'deactivated_at', type: 'timestamp with time zone', nullable: true })
  deactivatedAt?: Date;
}
