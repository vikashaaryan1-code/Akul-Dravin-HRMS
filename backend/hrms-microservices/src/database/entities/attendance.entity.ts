import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'attendance_records' })
export class AttendanceEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'attendance_date', type: 'date' })
  attendanceDate!: string;

  @Column({ name: 'check_in_at', type: 'timestamp with time zone', nullable: true })
  checkInAt!: Date | null;

  @Column({ name: 'check_out_at', type: 'timestamp with time zone', nullable: true })
  checkOutAt!: Date | null;

  @Column({ type: 'varchar', length: 40, default: 'present' })
  status!: string;

  @Column({ name: 'geo_location', type: 'varchar', length: 255, nullable: true })
  geoLocation!: string | null;
}
