import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as crypto from 'node:crypto';

/**
 * REFRESH TOKEN SERVICE
 *
 * Implements secure refresh token rotation:
 * - Each refresh issues a NEW token + invalidates the old one
 * - Tokens are hashed (SHA-256) before storage — raw token never stored
 * - Reuse detection: if a revoked token is presented, ALL sessions are revoked
 * - Family tracking: detects stolen token replay attacks
 *
 * Table: user_refresh_tokens
 *   id, userId, tokenHash, family, expiresAt, revokedAt, deviceInfo, ipAddress, createdAt
 */

// ── Lightweight entity interface (maps to user_refresh_tokens table) ──────────
import { RefreshTokenEntity } from '../../database/entities/refresh-token.entity';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  // Token lifetime
  private readonly TOKEN_TTL_MS   = 7 * 24 * 60 * 60 * 1000;  // 7 days
  private readonly TOKEN_BYTES    = 48;  // 384-bit raw token → 64-char hex

  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly tokenRepo: Repository<RefreshTokenEntity>,
  ) {}

  // ─── Issue ────────────────────────────────────────────────────────────────

  /**
   * Issue a new refresh token for a user session.
   * Returns the raw token (sent to client as HttpOnly cookie only).
   */
  async issue(params: {
    userId:     string;
    tenantId:   string;
    deviceInfo?: string;
    ipAddress?:  string;
    family?:     string;  // Omit to start a new family
  }): Promise<string> {
    const rawToken   = crypto.randomBytes(this.TOKEN_BYTES).toString('hex');
    const tokenHash  = this.hash(rawToken);
    const familyId   = params.family ?? crypto.randomUUID();
    const expiresAt  = new Date(Date.now() + this.TOKEN_TTL_MS);

    await this.tokenRepo.save({
      userId:     params.userId,
      tenantId:   params.tenantId,
      tokenHash,
      familyId,
      expiresAt,
      deviceName: params.deviceInfo ?? null,
      ipAddress:  params.ipAddress  ?? null,
      isRevoked:  false,
    });

    this.logger.log(`RT_ISSUED userId=${params.userId} familyId=${familyId}`);
    return rawToken;
  }

  // ─── Rotate ───────────────────────────────────────────────────────────────

  /**
   * Validate an incoming refresh token and issue a rotated replacement.
   * Implements reuse detection — revokes entire family if a revoked token is replayed.
   */
  async rotate(rawToken: string, ipAddress?: string): Promise<{
    newRawToken: string;
    userId:      string;
    tenantId:    string;
  }> {
    const tokenHash = this.hash(rawToken);

    const record = await this.tokenRepo.findOne({
      where: { tokenHash },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // ── Reuse detection: if already revoked → full family wipe ──────────────
    if (record.isRevoked) {
      this.logger.warn(
        `RT_REUSE_DETECTED userId=${record.userId} familyId=${record.familyId} ip=${ipAddress}`,
      );
      await this.revokeFamily(record.familyId);
      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions terminated for security.',
      );
    }

    // ── Expiry check ─────────────────────────────────────────────────────────
    if (new Date() > record.expiresAt) {
      await this.revoke(record.id);
      throw new UnauthorizedException('Refresh token expired. Please log in again.');
    }

    // ── Revoke old token ─────────────────────────────────────────────────────
    await this.revoke(record.id);

    // ── Issue rotated token in same family ───────────────────────────────────
    const newRawToken = await this.issue({
      userId:    record.userId,
      tenantId:  record.tenantId ?? '00000000-0000-0000-0000-000000000000',
      deviceInfo: record.deviceName ?? undefined,
      ipAddress,
      family:    record.familyId,
    });

    this.logger.log(`RT_ROTATED userId=${record.userId} familyId=${record.familyId}`);

    return { newRawToken, userId: record.userId, tenantId: record.tenantId ?? '00000000-0000-0000-0000-000000000000' };
  }

  // ─── Revoke ───────────────────────────────────────────────────────────────

  async revoke(id: string): Promise<void> {
    await this.tokenRepo.update(id, { isRevoked: true });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.tokenRepo
      .createQueryBuilder()
      .update()
      .set({ isRevoked: true })
      .where('userId = :userId AND isRevoked = false', { userId })
      .execute();
    this.logger.log(`RT_REVOKE_ALL userId=${userId}`);
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.tokenRepo
      .createQueryBuilder()
      .update()
      .set({ isRevoked: true })
      .where('family_id = :familyId AND is_revoked = false', { familyId })
      .execute();
    this.logger.warn(`RT_FAMILY_REVOKED familyId=${familyId}`);
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  /** Purge all expired/revoked tokens older than 30 days (call from cron). */
  async cleanupExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await this.tokenRepo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :cutoff OR isRevoked = true', { cutoff })
      .execute();
    const count = result.affected ?? 0;
    this.logger.log(`RT_CLEANUP deleted=${count}`);
    return count;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private hash(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
