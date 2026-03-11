import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  type: string;

  @Column({ default: 'all' })
  targetAudience: string;

  @Column({ type: 'simple-array', nullable: true })
  departmentIds: string[];

  @Column({ default: 'normal' })
  priority: string;

  @Column({ type: 'date' })
  publishDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ default: 'published' })
  status: string;

  @Column({ nullable: true })
  attachmentUrl: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
