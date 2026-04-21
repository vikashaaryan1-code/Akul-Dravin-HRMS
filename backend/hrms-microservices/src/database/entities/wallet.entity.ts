import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { EmployeeEntity } from './employee.entity';

@Entity({ name: 'wallets' })
export class WalletEntity extends TenantScopedEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  balance!: string;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @OneToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
