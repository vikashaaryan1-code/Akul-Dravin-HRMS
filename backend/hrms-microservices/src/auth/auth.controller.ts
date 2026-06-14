import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';

/** Frontend URL for redirecting after OAuth */
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Email / Password ──────────────────────────────────────────────────────

  /** 5 attempts per 60 seconds — brute-force guard */
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /** 3 registrations per 60 seconds — account spam guard */
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('accept-invitation')
  acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(acceptInvitationDto);
  }

  // ── Forgot / Reset Password ──────────────────────────────────────────────

  /**
   * POST /auth/forgot-password
   * Rate limited to 3/min to prevent email-spam attacks.
   * Always returns 200 OK regardless of whether email exists (prevents enumeration).
   */
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * POST /auth/reset-password
   * Rate limited to 5/min.
   */
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ── MFA ──────────────────────────────────────────────────────────────────

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  setupMfa(@CurrentUser() user: { sub: string; tenantId: string; email: string }) {
    return this.authService.setupMfa(user.sub, user.tenantId, user.email);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  verifyMfa(
    @CurrentUser() user: { sub: string; tenantId: string; email: string },
    @Body('code') code: string,
  ) {
    return this.authService.verifyMfa(user.sub, user.tenantId, user.email, code);
  }

  // ── Token Refresh ────────────────────────────────────────────────────────

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@CurrentUser() user: { sub: string; tenantId: string; email: string; role: string }) {
    return this.authService.refreshToken(user);
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  /**
   * GET /auth/google
   * Initiates the Google OAuth consent screen redirect.
   * No CSRF needed here — Google handles state via its own mechanism.
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google — no body needed
  }

  /**
   * GET /auth/google/callback
   * Google redirects here after the user grants (or denies) permission.
   * On success: issues JWT tokens and redirects to frontend /oauth-callback
   * On failure: redirects to frontend /login?error=oauth_failed
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req()  req: Request & { user?: UserEntity },
    @Res()  res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.redirect(`${frontendUrl}/login?error=oauth_cancelled`);
        return;
      }

      const { accessToken, refreshToken } = await this.authService.finalizeGoogleAuth(req.user);

      // Redirect to frontend with tokens encoded in query params.
      // The frontend /oauth-callback page reads these, stores in Zustand, and redirects to /dashboard.
      // Note: using short-lived access token in URL is acceptable here because:
      //   1. It's over HTTPS in production
      //   2. The frontend immediately reads and stores it, then the URL is cleared via history.replaceState
      //   3. Access token TTL is 15 min
      const params = new URLSearchParams({
        access_token:  accessToken,
        refresh_token: refreshToken,
      });
      res.redirect(`${frontendUrl}/oauth-callback?${params.toString()}`);
    } catch (err) {
      const errorMsg = encodeURIComponent((err as Error).message || 'Authentication failed');
      res.redirect(`${frontendUrl}/login?error=${errorMsg}`);
    }
  }

  /**
   * GET /auth/google/health
   * Returns Google OAuth configuration status (dev/debug only).
   */
  @Get('google/health')
  googleHealth() {
    return {
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'not-set',
      env: process.env.NODE_ENV,
    };
  }
}
