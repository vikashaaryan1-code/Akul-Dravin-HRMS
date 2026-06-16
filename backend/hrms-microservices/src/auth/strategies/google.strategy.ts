import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../database/entities/user.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { RoleEntity } from '../../database/entities/role.entity';

/**
 * GoogleStrategy
 *
 * Passport strategy for Google OAuth 2.0.
 *
 * Flow:
 *   1. User hits GET /api/v1/auth/google → redirected to Google consent screen
 *   2. Google redirects to GET /api/v1/auth/google/callback with ?code=...
 *   3. This strategy exchanges the code for a profile, then:
 *      a. Finds an existing user by google_id OR email
 *      b. If found by email (password account) → links google_id
 *      c. If not found → auto-provisions a new user (and a new tenant/company)
 *   4. The returned user object is attached to req.user by Passport
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly dataSource: DataSource) {
    super({
      clientID:     process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
      callbackURL:  process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4001/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
      // Include Google-verified email flag
      passReqToCallback: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const googleId = profile.id;
    const emails   = profile.emails ?? [];
    const email    = emails[0]?.value?.trim().toLowerCase();
    const fullName = profile.displayName
      || `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim()
      || 'Google User';
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    if (!email) {
      this.logger.warn(`Google OAuth: no email in profile for googleId=${googleId}`);
      done(new UnauthorizedException('Google account has no verified email address.'), undefined);
      return;
    }

    try {
      const user = await this.dataSource.transaction(async (manager) => {
        const userRepo    = manager.getRepository(UserEntity);
        const companyRepo = manager.getRepository(CompanyEntity);
        const roleRepo    = manager.getRepository(RoleEntity);

        // ── 1. Try to find by google_id first (fastest path) ──────────────
        let existing = await userRepo.findOne({
          where: { googleId },
          relations: ['role'],
        });

        // ── 2. Fall back to email lookup (links existing password account) ──
        if (!existing) {
          existing = await userRepo.findOne({
            where: { email },
            relations: ['role'],
          });
        }

        if (existing) {
          // Update google_id linkage and avatar if not already set
          const updates: Partial<UserEntity> = {};
          if (!existing.googleId)     updates.googleId     = googleId;
          if (!existing.avatarUrl)    updates.avatarUrl    = avatarUrl;
          if (!existing.emailVerified) updates.emailVerified = true;
          if (Object.keys(updates).length > 0) {
            await userRepo.update(existing.id, updates);
            Object.assign(existing, updates);
          }
          existing.lastLoginAt = new Date();
          await userRepo.save(existing);
          return existing;
        }

        // ── 3. Auto-provision a new tenant + user ─────────────────────────
        this.logger.log(`Google OAuth: auto-provisioning new user for email=${email}`);

        const tenantId   = uuidv4();
        const tenantCode = email.split('@')[0].replace(/[^a-z0-9]+/g, '-').substring(0, 64);

        const company = companyRepo.create({
          tenantId,
          tenantCode,
          legalName:   fullName,
          displayName: fullName,
          industry:    'Technology',
          status:      'active',
        });
        await companyRepo.save(company);

        const adminRole = roleRepo.create({
          tenantId,
          name:         'Company Admin',
          description:  'Full administrative access — auto-provisioned via Google OAuth',
          isSystemRole: false,
        });
        await roleRepo.save(adminRole);

        const newUser = userRepo.create({
          tenantId,
          email,
          passwordHash:  null, // Google-only account — no password
          fullName,
          googleId,
          oauthProvider: 'google',
          avatarUrl,
          emailVerified: true,
          roleId:        adminRole.id,
          isActive:      true,
          mfaEnabled:    false,
          lastLoginAt:   new Date(),
        });
        return userRepo.save(newUser);
      });

      done(null, user);
    } catch (err) {
      this.logger.error(`Google OAuth validate error: ${(err as Error).message}`, (err as Error).stack);
      done(err as Error, undefined);
    }
  }
}
