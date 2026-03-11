import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('exits')
export class Exit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @Column({ type: 'date' })
  resignationDate: Date;

  @Column({ type: 'date' })
  lastWorkingDay: Date;

  @Column()
  reason: string;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'simple-array', nullable: true })
  clearanceItems: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
