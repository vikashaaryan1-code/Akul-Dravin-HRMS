import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';

@Entity('work_activities')
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'date'])
export class WorkActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'varchar', name: 'project_name', nullable: true })
  projectName: string | null;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: string;

  @Column({ name: 'login_at', type: 'time', nullable: true })
  loginAt: string | null;

  @Column({ name: 'logout_at', type: 'time', nullable: true })
  logoutAt: string | null;

  @Column({ name: 'tasks_completed', type: 'int', default: 0 })
  tasksCompleted: number;

  @Column({ name: 'productive_hours', type: 'decimal', precision: 5, scale: 2, default: 0 })
  productiveHours: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => EmployeeEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
