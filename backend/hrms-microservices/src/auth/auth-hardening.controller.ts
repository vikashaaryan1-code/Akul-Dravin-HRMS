import { Body, Controller, Delete, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from './token.service';
import { LoginGuardService } from './login-guard.service';
import { TotpService } from './totp.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

function extractMeta(req: Request) {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.ip,
    userAgent: req.headers['user-agent'],
  };
}

@Controller('auth')
export class AuthHardeningController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly guardService: LoginGuardService,
    private readonly totpService: TotpService,
  ) {}

  /** Rotate refresh token → new pair */
  @Post('token/refresh')
  async refreshToken(@Body() body: { refreshToken: string }, @Req() req: Request) {
    if (!body.refreshToken) throw new UnauthorizedException('refreshToken is required');
    const meta = extractMeta(req);
    const result = await this.tokenService.rotateTokens(body.refreshToken, meta);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
  }

  /** Logout — revoke current refresh token */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() body: { refreshToken: string }, @Req() req: Request) {
    const user = (req as any).user;
    if (body.refreshToken) await this.tokenService.revokeToken(body.refreshToken);
    await this.guardService.record({
      userId: user?.id,
      tenantId: user?.tenantId,
      eventType: 'LOGOUT',
      ...extractMeta(req),
    });
    return { success: true };
  }

  /** Logout all sessions — revoke all tokens */
  @Post('logout/all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: Request) {
    const user = (req as any).user;
    await this.tokenService.revokeAllUserTokens(user?.id, user?.tenantId);
    return { success: true, message: 'All sessions terminated' };
  }

  /** Get active sessions for current user */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Req() req: Request) {
    const user = (req as any).user;
    const sessions = await this.tokenService.getUserActiveSessions(user?.id);
    return sessions.map(s => ({
      id: s.id,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      rotationCount: s.rotationCount,
    }));
  }

  /** Revoke a specific session */
  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async revokeSession(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    // security: users can only revoke their own sessions
    const sessions = await this.tokenService.getUserActiveSessions(user?.id);
    const target = sessions.find(s => s.id === id);
    if (!target) throw new UnauthorizedException('Session not found');
    await this.tokenService.revokeToken(target.tokenHash); // already hashed
    return { success: true };
  }

  /** Login history for current user */
  @Get('login-history')
  @UseGuards(JwtAuthGuard)
  async getLoginHistory(@Req() req: Request) {
    const user = (req as any).user;
    return this.guardService.getHistory(user?.id);
  }

  // ── 2FA Endpoints ─────────────────────────────────────────────────────────

  /** Setup 2FA — returns secret + QR URI */
  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setup2FA(@Req() req: Request) {
    const user = (req as any).user;
    return this.totpService.generateSetupPayload(user?.id, user?.email);
  }

  /** Verify & enable 2FA */
  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  async verify2FA(@Body() body: { encryptedSecret: string; code: string }, @Req() req: Request) {
    const user = (req as any).user;
    const valid = this.totpService.verifyCode(body.encryptedSecret, body.code);
    if (!valid) throw new UnauthorizedException('Invalid 2FA code');
    const backupCodes = this.totpService.generateBackupCodes();
    await this.guardService.record({ userId: user?.id, tenantId: user?.tenantId, eventType: '2FA_SUCCESS', ...extractMeta(req) });
    return { success: true, backupCodes };
  }
}
