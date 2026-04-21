import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../database/entities/user.entity';
import { CompanyEntity } from '../database/entities/company.entity';
import { RoleEntity } from '../database/entities/role.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { UserInvitationEntity, InvitationStatus } from '../database/entities/user-invitation.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ accessToken: string; user: Partial<UserEntity> }> {
    const { email, password, companyName, fullName, industry } = registerDto;
    const normalizedEmail = email.trim().toLowerCase();

    return await this.dataSource.transaction(async (manager) => {
      const existingUser = await manager.findOne(UserEntity, { where: { email: normalizedEmail } });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const tenantId = uuidv4();
      const tenantCode = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 64);

      const company = manager.create(CompanyEntity, {
        tenantId,
        tenantCode,
        legalName: companyName,
        displayName: companyName,
        industry: industry || 'Technology',
        status: 'active',
      });
      await manager.save(company);

      const adminRole = manager.create(RoleEntity, {
        tenantId,
        name: 'Company Admin',
        description: 'Full administrative access for the company tenant',
        isSystemRole: false,
      });
      await manager.save(adminRole);

      const passwordHash = await bcrypt.hash(password, 10);
      const user = manager.create(UserEntity, {
        tenantId,
        email: normalizedEmail,
        passwordHash,
        fullName,
        roleId: adminRole.id,
        isActive: true,
      });
      const savedUser = await manager.save(user);

      const payload = {
        sub: savedUser.id,
        tenantId: savedUser.tenantId,
        role: adminRole.name,
        email: savedUser.email,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      return {
        accessToken,
        user: {
          id: savedUser.id,
          tenantId: savedUser.tenantId,
          email: savedUser.email,
          fullName: savedUser.fullName,
          roleId: savedUser.roleId,
        } as any,
      };
    });
  }

  async acceptInvitation(dto: AcceptInvitationDto): Promise<{ accessToken: string; user: Partial<UserEntity> }> {
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

      const passwordHash = await bcrypt.hash(password, 10);
      const user = manager.create(UserEntity, {
        tenantId: invitation.tenantId,
        email: invitation.email,
        passwordHash,
        fullName,
        roleId: invitation.roleId,
        isActive: true,
      });
      const savedUser = await manager.save(user);

      invitation.status = InvitationStatus.ACCEPTED;
      await manager.save(invitation);

      const payload = {
        sub: savedUser.id,
        tenantId: savedUser.tenantId,
        email: savedUser.email,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      return {
        accessToken,
        user: {
          id: savedUser.id,
          tenantId: savedUser.tenantId,
          email: savedUser.email,
          fullName: savedUser.fullName,
          roleId: savedUser.roleId,
        } as any,
      };
    });
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: Partial<UserEntity> }> {
    const email = loginDto.email.trim().toLowerCase();
    
    // Hardened Login: Fetch real user and verify hash
    const user = await this.dataSource.getRepository(UserEntity).findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or account deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.dataSource.getRepository(UserEntity).save(user);

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role?.name || 'User',
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
        roleId: user.roleId,
      } as any,
    };
  }
}
