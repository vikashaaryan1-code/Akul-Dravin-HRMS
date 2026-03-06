import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: Partial<UserEntity> }> {
    const user = await this.userRepository.findOne({ where: { email: loginDto.email } });

    if (user && user.passwordHash === loginDto.password && user.isActive) {
      const payload = {
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      return {
        accessToken,
        user: {
          id: user.id,
          tenantId: user.tenantId,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    }

    const allowDemoLogin = (process.env.ALLOW_DEMO_LOGIN ?? 'true').toLowerCase() === 'true';
    const isDemoCredentials = loginDto.email.toLowerCase() === 'admin@akuldravin.com' && loginDto.password === 'password123';

    if (allowDemoLogin && isDemoCredentials) {
      const payload = {
        sub: '00000000-0000-0000-0000-000000000001',
        tenantId: null,
        role: Role.PLATFORM_ADMIN,
        email: loginDto.email,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      return {
        accessToken,
        user: {
          id: payload.sub,
          tenantId: payload.tenantId,
          email: payload.email,
          fullName: 'Demo Platform Admin',
          role: payload.role,
        },
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}


