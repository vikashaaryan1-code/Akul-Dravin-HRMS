import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { Role } from '../../common/enums/role.enum';

@Entity({ name: 'users' })
export class UserEntity extends TenantScopedEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 190 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 140 })
  fullName!: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
