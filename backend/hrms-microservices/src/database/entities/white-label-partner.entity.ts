import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('white_label_partners')
export class WhiteLabelPartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  partnerName: string;

  @Column({ unique: true })
  subdomain: string;

  @Column({ nullable: true })
  customDomain: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  faviconUrl: string;

  @Column({ default: '#1a73e8' })
  primaryColor: string;

  @Column({ default: '#34a853' })
  secondaryColor: string;

  @Column({ default: '#fbbc04' })
  accentColor: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  supportEmail: string;

  @Column({ nullable: true })
  supportPhone: string;

  @Column({ type: 'jsonb', nullable: true })
  emailTemplates: any;

  @Column({ type: 'jsonb', nullable: true })
  features: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  planId: string;

  @Column({ type: 'int', default: 0 })
  clientCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyRevenue: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
