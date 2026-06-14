import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { RefreshTokenEntity } from '../database/entities/refresh-token.entity';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string | null;
}

const ACCESS_TTL_SECONDS  = 15 * 60;           // 15 min
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshTokenEntity)
    private readonly rtRepo: Repository<RefreshTokenEntity>,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private generateRawToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private getDeviceName(userAgent?: string): string {
    if (!userAgent) return 'Unknown Device';
    if (/iPhone|iPad/i.test(userAgent)) return 'iOS Device';
    if (/Android/i.test(userAgent)) return 'Android Device';
    if (/Windows/i.test(userAgent)) return 'Windows PC';
    if (/Mac/i.test(userAgent)) return 'Mac';
    if (/Linux/i.test(userAgent)) return 'Linux';
    return 'Browser';
  }

  // ── Token Issuance ────────────────────────────────────────────────────────

  async issueTokenPair(
    payload: AccessTokenPayload,
    meta?: { ip?: string; userAgent?: string; deviceId?: string },
  ): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TTL_SECONDS });

    const rawRefresh  = this.generateRawToken();
    const familyId    = randomBytes(16).toString('hex');
    const expiresAt   = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

    await this.rtRepo.save(
      this.rtRepo.create({
        tokenHash:    this.hash(rawRefresh),
        userId:       payload.sub,
        tenantId:     payload.tenantId,
        familyId,
        deviceId:     meta?.deviceId ?? null,
        deviceName:   this.getDeviceName(meta?.userAgent),
        ipAddress:    meta?.ip ?? null,
        userAgent:    meta?.userAgent ?? null,
        isRevoked:    false,
        rotationCount: 0,
        expiresAt,
        lastUsedAt:   new Date(),
      }),
    );

    return { accessToken, refreshToken: rawRefresh, expiresIn: ACCESS_TTL_SECONDS };
  }

  // ── Token Rotation (refresh → new pair) ──────────────────────────────────

  async rotateTokens(
    rawRefreshToken: string,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<TokenPair & { userId: string; tenantId: string | null; role: string; email: string }> {
    const tokenHash = this.hash(rawRefreshToken);
    const stored = await this.rtRepo.findOne({ where: { tokenHash } });

    if (!stored) throw new UnauthorizedException('Invalid refresh token');
    if (stored.isRevoked) {
      // Possible token reuse attack — revoke entire family
      await this.revokeFamilyTokens(stored.familyId, 'token_reuse_attack');
      throw new UnauthorizedException('Token reuse detected. All sessions invalidated.');
    }
    if (stored.expiresAt < new Date()) {
      await this.rtRepo.update(stored.id, { isRevoked: true });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token
    await this.rtRepo.update(stored.id, { isRevoked: true, lastUsedAt: new Date() });

    // Retrieve user info from the stored access payload via user table
    // (we embed minimal info in the token for stateless rotation)
    const newRaw = this.generateRawToken();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

    // Re-issue access token — note: in prod, load fresh user/role from DB here
    const accessPayload: AccessTokenPayload = {
      sub: stored.userId,
      email: '', // re-populated by caller
      role: '',  // re-populated by caller
      tenantId: stored.tenantId,
    };
    const accessToken = this.jwtService.sign(accessPayload, { expiresIn: ACCESS_TTL_SECONDS });

    await this.rtRepo.save(
      this.rtRepo.create({
        tokenHash:    this.hash(newRaw),
        userId:       stored.userId,
        tenantId:     stored.tenantId,
        familyId:     stored.familyId,
        deviceId:     stored.deviceId,
        deviceName:   stored.deviceName ?? this.getDeviceName(meta?.userAgent),
        ipAddress:    meta?.ip ?? stored.ipAddress,
        userAgent:    meta?.userAgent ?? stored.userAgent,
        isRevoked:    false,
        rotationCount: stored.rotationCount + 1,
        expiresAt,
        lastUsedAt:   new Date(),
      }),
    );

    return {
      accessToken,
      refreshToken: newRaw,
      expiresIn: ACCESS_TTL_SECONDS,
      userId: stored.userId,
      tenantId: stored.tenantId,
      role: '',
      email: '',
    };
  }

  // ── Revocation ────────────────────────────────────────────────────────────

  async revokeToken(rawToken: string): Promise<void> {
    const hash = this.hash(rawToken);
    await this.rtRepo.update({ tokenHash: hash }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string, tenantId?: string | null): Promise<void> {
    const where: any = { userId, isRevoked: false };
    if (tenantId !== undefined) where.tenantId = tenantId;
    await this.rtRepo.update(where, { isRevoked: true });
  }

  private async revokeFamilyTokens(familyId: string, reason: string): Promise<void> {
    this.logger.warn(`SECURITY: revoking token family ${familyId} — reason: ${reason}`);
    await this.rtRepo.update({ familyId }, { isRevoked: true });
  }

  async getUserActiveSessions(userId: string): Promise<RefreshTokenEntity[]> {
    return this.rtRepo.find({
      where: { userId, isRevoked: false },
      order: { lastUsedAt: 'DESC' },
    });
  }

  // ── Maintenance ──────────────────────────────────────────────────────────

  async pruneExpiredTokens(): Promise<number> {
    const result = await this.rtRepo.delete({ expiresAt: LessThan(new Date()) });
    return result.affected ?? 0;
  }
}
