import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', name: 'check_in', nullable: true })
  checkIn: string;

  @Column({ type: 'time', name: 'check_out', nullable: true })
  checkOut: string;

  @Column({ type: 'varchar', length: 100, name: 'check_in_location', nullable: true })
  checkInLocation: string;

  @Column({ type: 'varchar', length: 100, name: 'check_out_location', nullable: true })
  checkOutLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'check_in_lat', nullable: true })
  checkInLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'check_in_lng', nullable: true })
  checkInLng: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'check_out_lat', nullable: true })
  checkOutLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'check_out_lng', nullable: true })
  checkOutLng: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'total_hours', nullable: true })
  totalHours: number;

  @Column({ type: 'varchar', length: 50, default: 'present' })
  status: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
