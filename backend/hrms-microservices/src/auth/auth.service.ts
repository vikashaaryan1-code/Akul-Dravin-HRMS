import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../database/entities/user.entity';
import { CompanyEntity } from '../database/entities/company.entity';
import { RoleEntity } from '../database/entities/role.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserInvitationEntity, InvitationStatus } from '../database/entities/user-invitation.entity';
import { AuditLogService, AuditAction } from '../common/audit/audit-log.service';
import { EmailSenderService } from '../common/email/email-sender.service';
import { welcomeEmail } from '../common/email/email-templates';

// ─── TOTP Constants ──────────────────────────────────────────────────────────
const TOTP_PERIOD  = 30;  // seconds
const TOTP_DIGITS  = 6;
const BCRYPT_COST  = 12;  // upgrade from 10 — new hashes use 12
const BCRYPT_REGEX = /^\$2[ab]?\$\d+\$/;

// Password reset token TTL: 15 minutes
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

export interface JwtPayload {
  sub:      string;
  tenantId: string;
  role:     string;
  email:    string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService:    JwtService,
    private readonly dataSource:    DataSource,
    private readonly auditLog:      AuditLogService,
    private readonly emailSender:   EmailSenderService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ═══════════════════════════════════════════════════════════════════════════

  async register(
    registerDto: RegisterDto,
  ): Promise<{ accessToken: string; user: Partial<UserEntity> }> {
    const { email, password, companyName, fullName, industry } = registerDto;
    const normalizedEmail = email.trim().toLowerCase();

    return await this.dataSource.transaction(async (manager) => {
      const existingUser = await manager.findOne(UserEntity, { where: { email: normalizedEmail } });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const tenantId   = uuidv4();
      const tenantCode = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 64);

      const company = manager.create(CompanyEntity, {
        tenantId,
        tenantCode,
        legalName:   companyName,
        displayName: companyName,
        industry:    industry || 'Technology',
        status:      'active',
      });
      await manager.save(company);

      const adminRole = manager.create(RoleEntity, {
        tenantId,
        name:        'Company Admin',
        description: 'Full administrative access for the company tenant',
        isSystemRole: false,
      });
      await manager.save(adminRole);

      const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
      const user = manager.create(UserEntity, {
        tenantId,
        email:         normalizedEmail,
        passwordHash,
        fullName,
        roleId:        adminRole.id,
        oauthProvider: 'email',
        emailVerified: false,
        isActive:      true,
        mfaEnabled:    false,
      });
      const savedUser = await manager.save(user);

      const payload: JwtPayload = {
        sub:      savedUser.id,
        tenantId: savedUser.tenantId,
        role:     adminRole.name,
        email:    savedUser.email,
      };
      const accessToken = await this.jwtService.signAsync(payload);

      await this.auditLog.log(AuditAction.AUTH_REGISTER, {
        tenantId:    savedUser.tenantId,
        actorId:     savedUser.id,
        actorEmail:  savedUser.email,
        resourceType: 'user',
        resourceId:   savedUser.id,
        metadata: { source: 'self-register' },
      });

      const tmpl = welcomeEmail({ fullName, email: normalizedEmail });
      this.emailSender.send({ to: normalizedEmail, ...tmpl }).catch((err: unknown) => {
        this.logger.warn(`WELCOME_EMAIL_FAILED userId=${savedUser.id} err=${(err as Error).message}`);
      });

      return {
        accessToken,
        user: {
          id:       savedUser.id,
          tenantId: savedUser.tenantId,
          email:    savedUser.email,
          fullName: savedUser.fullName,
          roleId:   savedUser.roleId,
        } as Partial<UserEntity>,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCEPT INVITATION
  // ═══════════════════════════════════════════════════════════════════════════

  async acceptInvitation(
    dto: AcceptInvitationDto,
  ): Promise<{ accessToken: string; user: Partial<UserEntity> }> {
    const { token, password, fullName } = dto;

    return await this.dataSource.transaction(async (manager) => {
      const invitation = await manager.findOne(UserInvitationEntity, {
        where: { token, status: InvitationStatus.PENDING },
      });

      if (!invitation) {
        throw new UnauthorizedException('Invalid or expired invitation token');
      }

      if (invitation.expiresAt < new Date()) {
        invitation.status = InvitationStatus.EXPIRED;
        await manager.save(invitation);
        throw new UnauthorizedException('Invitation token has expired');
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
      const user = manager.create(UserEntity, {
        tenantId:      invitation.tenantId,
        email:         invitation.email,
        passwordHash,
        fullName,
        roleId:        invitation.roleId,
        oauthProvider: 'email',
        emailVerified: false,
        isActive:      true,
        mfaEnabled:    false,
      });
      const savedUser = await manager.save(user);

      invitation.status = InvitationStatus.ACCEPTED;
      await manager.save(invitation);

      const payload: JwtPayload = {
        sub:      savedUser.id,
        tenantId: savedUser.tenantId,
        email:    savedUser.email,
        role:     'User',
      };
      const accessToken = await this.jwtService.signAsync(payload);

      await this.auditLog.log(AuditAction.AUTH_REGISTER, {
        tenantId:    savedUser.tenantId,
        actorId:     savedUser.id,
        actorEmail:  savedUser.email,
        resourceType: 'user',
        resourceId:   savedUser.id,
        metadata: { source: 'invitation', invitationToken: token.substring(0, 8) + '...' },
      });

      return {
        accessToken,
        user: {
          id:       savedUser.id,
          tenantId: savedUser.tenantId,
          email:    savedUser.email,
          fullName: savedUser.fullName,
          roleId:   savedUser.roleId,
        } as Partial<UserEntity>,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN — with lazy bcrypt migration
  // ═══════════════════════════════════════════════════════════════════════════

  async login(loginDto: LoginDto): Promise<{
    accessToken:     string;
    user:            Partial<UserEntity>;
    mfaRequired:     boolean;
    mfaSetupPending: boolean;
  }> {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.dataSource.getRepository(UserEntity).findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or account deactivated');
    }

    // Google-only account — cannot login with password
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account was created via Google Sign-In. Please use "Continue with Google".',
      );
    }

    // ── Lazy migration: detect plaintext vs bcrypt ────────────────────────────
    const isAlreadyHashed = BCRYPT_REGEX.test(user.passwordHash);
    let isPasswordValid = false;

    if (isAlreadyHashed) {
      isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    } else {
      isPasswordValid = crypto.timingSafeEqual(
        Buffer.from(loginDto.password),
        Buffer.from(user.passwordHash),
      );
      if (isPasswordValid) {
        const newHash = await bcrypt.hash(loginDto.password, BCRYPT_COST);
        await this.dataSource.getRepository(UserEntity).update(user.id, { passwordHash: newHash });
        user.passwordHash = newHash;
        this.logger.warn(
          `LAZY_MIGRATION_COMPLETE userId=${user.id} email=${user.email} — ` +
          'plaintext password upgraded to bcrypt.',
        );
        await this.auditLog.log(AuditAction.AUTH_LOGIN, {
          tenantId:   user.tenantId,
          actorId:    user.id,
          actorEmail: user.email,
          metadata:   { event: 'CREDENTIAL_UPGRADED_BCRYPT' },
        });
      }
    }

    if (!isPasswordValid) {
      this.auditLog.log(AuditAction.AUTH_LOGIN_FAILED, {
        tenantId:   user.tenantId,
        actorId:    user.id,
        actorEmail: user.email,
        metadata:   { reason: 'invalid_credentials' },
      }).catch(() => { /* already logged inside AuditLogService */ });
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await this.dataSource.getRepository(UserEntity).save(user);

    const payload: JwtPayload = {
      sub:      user.id,
      tenantId: user.tenantId,
      role:     user.role?.name || 'User',
      email:    user.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.auditLog.log(AuditAction.AUTH_LOGIN, {
      tenantId:    user.tenantId,
      actorId:     user.id,
      actorEmail:  user.email,
      resourceType: 'user',
      resourceId:   user.id,
    });

    return {
      accessToken,
      user: {
        id:       user.id,
        tenantId: user.tenantId,
        email:    user.email,
        fullName: user.fullName,
        roleId:   user.roleId,
        avatarUrl: user.avatarUrl,
        oauthProvider: user.oauthProvider,
      } as Partial<UserEntity>,
      mfaRequired:     user.mfaEnabled,
      mfaSetupPending: !user.mfaTotpSecret,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH FINALIZATION
  // Converts a validated Google profile (req.user from GoogleStrategy) into
  // a signed JWT pair and returns it to the controller for redirect.
  // ═══════════════════════════════════════════════════════════════════════════

  async finalizeGoogleAuth(googleUser: UserEntity): Promise<{
    accessToken:  string;
    refreshToken: string;
    user:         Partial<UserEntity>;
  }> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const user     = await userRepo.findOne({
      where: { id: googleUser.id },
      relations: ['role'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive or not found');
    }

    const payload: JwtPayload = {
      sub:      user.id,
      tenantId: user.tenantId,
      role:     user.role?.name || 'User',
      email:    user.email,
    };

    const accessToken  = await this.jwtService.signAsync(payload, {
      expiresIn: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 900), // 15 min
    });
    // Separate long-lived refresh token signed with refresh secret
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:    process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'refresh-secret',
      expiresIn: 30 * 24 * 60 * 60, // 30 days
    });

    await this.auditLog.log(AuditAction.AUTH_LOGIN, {
      tenantId:    user.tenantId,
      actorId:     user.id,
      actorEmail:  user.email,
      resourceType: 'user',
      resourceId:   user.id,
      metadata: { provider: 'google' },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id:            user.id,
        tenantId:      user.tenantId,
        email:         user.email,
        fullName:      user.fullName,
        roleId:        user.roleId,
        avatarUrl:     user.avatarUrl,
        oauthProvider: user.oauthProvider,
        emailVerified: user.emailVerified,
      } as Partial<UserEntity>,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORGOT PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const userRepo = this.dataSource.getRepository(UserEntity);
    const user = await userRepo.findOne({ where: { email } });

    // Always return success to prevent email enumeration attacks
    if (!user || !user.isActive) {
      this.logger.log(`FORGOT_PASSWORD: no-op for email=${email} (not found or inactive)`);
      return { message: 'If that email exists in our system, a reset link has been sent.' };
    }

    // Google-only accounts cannot reset password
    if (!user.passwordHash) {
      this.logger.log(`FORGOT_PASSWORD: no-op for google-only account email=${email}`);
      return { message: 'If that email exists in our system, a reset link has been sent.' };
    }

    // Generate cryptographically secure raw token
    const rawToken = crypto.randomBytes(48).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await userRepo.update(user.id, {
      passwordResetToken:     tokenHash,
      passwordResetExpiresAt: expiresAt,
    });

    // Send email with the raw token (never store raw)
    const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password?token=${rawToken}`;
    try {
      await this.emailSender.send({
        to:      email,
        subject: 'Reset your Akul Dravin password',
        htmlBody: `
          <p>Hi ${user.fullName},</p>
          <p>You requested a password reset. Click the link below within 15 minutes:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you did not request this, please ignore this email.</p>
        `,
        textBody: `Password reset link (expires in 15 min): ${resetUrl}`,
      });
    } catch (err) {
      this.logger.warn(`FORGOT_PASSWORD_EMAIL_FAILED userId=${user.id} err=${(err as Error).message}`);
    }

    await this.auditLog.log(AuditAction.AUTH_LOGIN, {
      tenantId:   user.tenantId,
      actorId:    user.id,
      actorEmail: user.email,
      metadata:   { event: 'PASSWORD_RESET_REQUESTED' },
    });

    return { message: 'If that email exists in our system, a reset link has been sent.' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const userRepo  = this.dataSource.getRepository(UserEntity);

    const user = await userRepo.findOne({ where: { passwordResetToken: tokenHash } });

    if (!user || !user.passwordResetExpiresAt) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (user.passwordResetExpiresAt < new Date()) {
      // Clear the expired token
      await userRepo.update(user.id, {
        passwordResetToken:     null,
        passwordResetExpiresAt: null,
      });
      throw new BadRequestException('Password reset token has expired. Please request a new one.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_COST);

    await userRepo.update(user.id, {
      passwordHash,
      passwordResetToken:     null,
      passwordResetExpiresAt: null,
      oauthProvider:          'email', // mark as email account now that password is set
    });

    await this.auditLog.log(AuditAction.AUTH_LOGIN, {
      tenantId:   user.tenantId,
      actorId:    user.id,
      actorEmail: user.email,
      metadata:   { event: 'PASSWORD_RESET_COMPLETED' },
    });

    this.logger.log(`PASSWORD_RESET_COMPLETED userId=${user.id} email=${user.email}`);

    return { message: 'Password has been reset successfully. You can now sign in.' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MFA SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  async setupMfa(
    userId: string,
    tenantId: string,
    userEmail: string,
  ): Promise<{ otpauthUrl: string; manualKey: string }> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const user = await userRepo.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.mfaEnabled) throw new BadRequestException('MFA already enabled for this account');

    const secret = crypto.randomBytes(20).toString('hex').toUpperCase();
    await userRepo.update(userId, { mfaTotpSecret: secret });

    const issuer      = process.env.APP_NAME ?? 'AkulDravinHRMS';
    const accountName = encodeURIComponent(userEmail);
    const otpauthUrl  = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;

    await this.auditLog.log(AuditAction.AUTH_MFA_SETUP, {
      tenantId,
      actorId:    userId,
      actorEmail: userEmail,
      metadata:   { event: 'MFA_SETUP_INITIATED' },
    });

    return { otpauthUrl, manualKey: secret };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MFA VERIFY
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyMfa(
    userId: string,
    tenantId: string,
    userEmail: string,
    code: string,
  ): Promise<{ enabled: boolean }> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const user = await userRepo.findOne({ where: { id: userId, tenantId } });
    if (!user || !user.mfaTotpSecret) {
      throw new BadRequestException('MFA setup not initiated — call POST /auth/mfa/setup first');
    }
    if (user.mfaEnabled) {
      throw new BadRequestException('MFA already enabled');
    }

    const isValid = this.validateTotp(user.mfaTotpSecret, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await userRepo.update(userId, { mfaEnabled: true });

    await this.auditLog.log(AuditAction.AUTH_MFA_SETUP, {
      tenantId,
      actorId:    userId,
      actorEmail: userEmail,
      metadata:   { event: 'MFA_ENABLED' },
    });

    return { enabled: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH TOKEN
  // ═══════════════════════════════════════════════════════════════════════════

  async refreshToken(
    user: { sub: string; tenantId: string; email: string; role: string },
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const expiresIn   = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 900);
    const payload: JwtPayload = {
      sub:      user.sub,
      tenantId: user.tenantId,
      email:    user.email,
      role:     user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });
    this.logger.debug(`TOKEN_REFRESHED userId=${user.sub}`);
    return { accessToken, expiresIn };
  }

  // ─── TOTP Implementation (RFC 6238) ──────────────────────────────────────

  private validateTotp(secret: string, code: string): boolean {
    const t = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
    for (const step of [t - 1, t, t + 1]) {
      if (this.generateTotp(secret, step) === code.trim()) return true;
    }
    return false;
  }

  private generateTotp(secret: string, t: number): string {
    const counter = Buffer.alloc(8);
    counter.writeUInt32BE(Math.floor(t / 0x100000000), 0);
    counter.writeUInt32BE(t >>> 0, 4);

    const key  = Buffer.from(secret, 'hex');
    const hmac = crypto.createHmac('sha1', key).update(counter).digest();

    const offset = hmac[hmac.length - 1] & 0x0f;
    const bin    = ((hmac[offset]     & 0x7f) << 24)
                 | ((hmac[offset + 1] & 0xff) << 16)
                 | ((hmac[offset + 2] & 0xff) << 8)
                 | (hmac[offset + 3] & 0xff);

    return String(bin % Math.pow(10, TOTP_DIGITS)).padStart(TOTP_DIGITS, '0');
  }
}
