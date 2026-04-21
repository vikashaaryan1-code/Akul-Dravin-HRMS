import { Column, Entity, Index } from 'typeorm';
import { BaseEntityWithTimestamps } from './base.entity';

@Entity({ name: 'permissions' })
export class PermissionEntity extends BaseEntityWithTimestamps {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug!: string; // e.g., 'payroll.read', 'employee.write'

  @Column({ type: 'varchar', length: 255 })
  name!: string; // Friendly name

  @Column({ type: 'text', nullable: true })
  description?: string;
}
