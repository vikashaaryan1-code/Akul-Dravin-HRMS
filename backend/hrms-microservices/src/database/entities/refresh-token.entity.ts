import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refresh_tokens')
@Index(['userId', 'tenantId'])
@Index(['tokenHash'])
@Index(['expiresAt'])
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** SHA-256 hash of the actual token — never store raw */
  @Index({ unique: true })
  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'device_id', type: 'varchar', length: 128, nullable: true })
  deviceId: string | null;

  @Column({ name: 'device_name', type: 'varchar', length: 200, nullable: true })
  deviceName: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  isRevoked: boolean;

  /** The family of tokens — for rotation detection (if old family token used: revoke entire family) */
  @Index()
  @Column({ name: 'family_id', type: 'uuid' })
  familyId: string;

  @Column({ name: 'rotation_count', type: 'int', default: 0 })
  rotationCount: number;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ name: 'last_used_at', type: 'timestamp with time zone', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
