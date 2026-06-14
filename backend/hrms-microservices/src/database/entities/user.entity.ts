import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'users' })
export class UserEntity extends TenantScopedEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 190 })
  email!: string;

  /**
   * Nullable so that Google-only (passwordless) OAuth accounts work.
   * Always null for users who registered via Google without setting a password.
   */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash?: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 140 })
  fullName!: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role?: RoleEntity;

  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'deactivated_at', type: 'timestamp with time zone', nullable: true })
  deactivatedAt?: Date;

  // ── MFA ─────────────────────────────────────────────────────────────────────

  /**
   * TOTP secret for Google Authenticator-compatible MFA.
   * Null until the user completes MFA setup via POST /auth/mfa/setup.
   * Never expose in API responses.
   */
  @Column({ name: 'mfa_totp_secret', type: 'varchar', length: 64, nullable: true })
  mfaTotpSecret?: string;

  /**
   * MFA enforcement flag. False = setup pending / not opted in.
   * Soft-enforce: login still succeeds, but mfaSetupPending is returned in response.
   */
  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled!: boolean;

  // ── Google OAuth ─────────────────────────────────────────────────────────────

  /**
   * Google OAuth sub ID (unique per Google account).
   * Set only for users who signed in via Google OAuth.
   * Partial unique index enforced at DB level (WHERE google_id IS NOT NULL).
   */
  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  googleId?: string | null;

  /**
   * Authentication provider: 'email' | 'google'
   * Defaults to 'email' for password-based accounts.
   */
  @Column({ name: 'oauth_provider', type: 'varchar', length: 32, default: 'email' })
  oauthProvider!: string;

  /**
   * Profile picture URL from Google OAuth or custom upload.
   * Null for password-based accounts that have not set an avatar.
   */
  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl?: string | null;

  /**
   * Whether the email address has been verified.
   * Automatically true for Google OAuth accounts (Google verifies).
   * False until the user clicks the verification link for email accounts.
   */
  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  // ── Password Reset ───────────────────────────────────────────────────────────

  /**
   * SHA-256 hashed reset token (raw token is emailed to user).
   * Never store the raw token.
   */
  @Column({ name: 'password_reset_token', type: 'varchar', length: 128, nullable: true })
  passwordResetToken?: string | null;

  /**
   * Expiry timestamp for the password reset token (15 min TTL).
   */
  @Column({ name: 'password_reset_expires_at', type: 'timestamp with time zone', nullable: true })
  passwordResetExpiresAt?: Date | null;
}
