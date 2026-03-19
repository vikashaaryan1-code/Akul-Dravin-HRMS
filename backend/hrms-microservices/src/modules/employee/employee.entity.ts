import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employeeId' })
  employeeId: string;

  @Column({ name: 'firstName' })
  firstName: string;

  @Column({ name: 'lastName' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ type: 'date' })
  joiningDate: Date;

  @Column({ nullable: true })
  departmentId: string;

  @Column({ nullable: true })
  designationId: string;

  @Column({ nullable: true })
  branchId: string;

  @Column({ name: 'company_id', nullable: true, default: '00000000-0000-0000-0000-000000000000' })
  companyId: string;

  @Column({ nullable: true })
  managerId: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salary: number;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  ifscCode: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  aadharNumber: string;

  @Column({ nullable: true })
  pfNumber: string;

  @Column({ nullable: true })
  esiNumber: string;

  @Column({ nullable: true })
  profileImage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
