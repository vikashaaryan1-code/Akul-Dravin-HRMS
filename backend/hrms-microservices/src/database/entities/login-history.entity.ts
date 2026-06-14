import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type LoginEventType = 'SUCCESS' | 'FAILURE' | 'LOGOUT' | 'TOKEN_REFRESH' | 'FORCE_LOGOUT' | '2FA_REQUIRED' | '2FA_SUCCESS' | '2FA_FAILED';

@Entity('login_history')
@Index(['userId', 'createdAt'])
@Index(['ipAddress'])
export class LoginHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'event_type', type: 'varchar', length: 30 })
  eventType: LoginEventType;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'device_name', type: 'varchar', length: 200, nullable: true })
  deviceName: string | null;

  @Column({ name: 'location_country', type: 'varchar', length: 60, nullable: true })
  locationCountry: string | null;

  @Column({ name: 'failure_reason', type: 'varchar', length: 200, nullable: true })
  failureReason: string | null;

  /** Session or device ID for correlation */
  @Column({ name: 'session_id', type: 'varchar', length: 128, nullable: true })
  sessionId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
