import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserEntity } from '../database/entities/user.entity';
import { CompanyEntity } from '../database/entities/company.entity';
import { RoleEntity } from '../database/entities/role.entity';
import { PermissionEntity } from '../database/entities/permission.entity';
import { UserInvitationEntity } from '../database/entities/user-invitation.entity';
import { AuditLogModule } from '../common/audit/audit-log.module';
import { EmailModule } from '../common/email/email.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
          throw new Error('[BOOT] JWT_SECRET environment variable is not set. Refusing to start in production.');
        }
        return secret ?? 'dev-only-secret-change-in-production';
      })(),
      signOptions: {
        expiresIn: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 900), // 15 min default
      },
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      CompanyEntity,
      RoleEntity,
      PermissionEntity,
      UserInvitationEntity,
    ]),
    AuditLogModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers:   [AuthService, JwtStrategy, GoogleStrategy],
  exports:     [JwtModule, PassportModule, AuthService],
})
export class AuthModule {}
