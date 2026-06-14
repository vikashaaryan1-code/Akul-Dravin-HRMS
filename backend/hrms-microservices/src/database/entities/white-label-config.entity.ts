import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('white_label_configs')
export class WhiteLabelConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'brand_name', type: 'varchar', nullable: true })
  brandName: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'favicon_url', type: 'text', nullable: true })
  faviconUrl: string | null;

  @Column({ name: 'primary_color', length: 7, default: '#3b82f6' })
  primaryColor: string;

  @Column({ name: 'secondary_color', length: 7, default: '#8b5cf6' })
  secondaryColor: string;

  @Column({ name: 'accent_color', length: 7, default: '#22d3ee' })
  accentColor: string;

  @Column({ name: 'sidebar_bg', type: 'varchar', length: 7, nullable: true })
  sidebarBg: string | null;

  @Column({ name: 'custom_domain', type: 'varchar', nullable: true })
  customDomain: string | null;

  @Column({ name: 'smtp_host', type: 'varchar', nullable: true })
  smtpHost: string | null;

  @Column({ name: 'smtp_port', type: 'int', nullable: true })
  smtpPort: number | null;

  @Column({ name: 'smtp_user', type: 'varchar', nullable: true })
  smtpUser: string | null;

  @Column({ name: 'smtp_password', type: 'varchar', nullable: true })
  smtpPassword: string | null;

  @Column({ name: 'from_email', type: 'varchar', nullable: true })
  fromEmail: string | null;

  @Column({ name: 'from_name', type: 'varchar', nullable: true })
  fromName: string | null;

  @Column({ name: 'login_bg_url', type: 'text', nullable: true })
  loginBgUrl: string | null;

  @Column({ name: 'login_tagline', type: 'varchar', nullable: true })
  loginTagline: string | null;

  @Column({ name: 'feature_toggles', type: 'jsonb', default: '{}' })
  featureToggles: Record<string, boolean>;

  @Column({ name: 'custom_css', type: 'text', nullable: true })
  customCss: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
