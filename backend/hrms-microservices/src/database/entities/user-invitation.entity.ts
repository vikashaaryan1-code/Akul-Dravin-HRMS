import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity({ name: 'user_invitations' })
export class UserInvitationEntity extends TenantScopedEntity {
  @Index()
  @Column({ type: 'varchar', length: 190 })
  email!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  token!: string;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @Column({ name: 'invited_by_id', type: 'uuid', nullable: true })
  invitedById?: string;
}
