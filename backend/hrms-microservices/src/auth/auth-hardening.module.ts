import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RefreshTokenEntity } from '../database/entities/refresh-token.entity';
import { LoginHistoryEntity } from '../database/entities/login-history.entity';
import { TokenService } from './token.service';
import { LoginGuardService } from './login-guard.service';
import { TotpService } from './totp.service';
import { AuthHardeningController } from './auth-hardening.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokenEntity, LoginHistoryEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change_this_for_production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthHardeningController],
  providers: [TokenService, LoginGuardService, TotpService],
  exports: [TokenService, LoginGuardService, TotpService],
})
export class AuthHardeningModule {}
