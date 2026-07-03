import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../database/entities/user.entity';
import { UserInvitationEntity, InvitationStatus } from '../../database/entities/user-invitation.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserInvitationEntity)
    private readonly userInvitationRepository: Repository<UserInvitationEntity>,
  ) {}

  findAll(): Promise<UserEntity[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    this.logger.log(`Creating user for email=${dto.email}`);

    try {
      const user = this.userRepository.create({
        tenantId: dto.tenantId ?? uuidv4(),
        email: dto.email,
        passwordHash: dto.password,
        fullName: dto.fullName,
        isActive: true,
        oauthProvider: 'email',
        emailVerified: false,
        mfaEnabled: false,
      });
      return await this.userRepository.save(user);
    } catch (error: any) {
      this.logger.warn(`Failed user create for email=${dto.email}: ${error.message}`);
      throw new BadRequestException('Unable to create user');
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const existing = await this.findOne(id);

    try {
      if (dto.tenantId) existing.tenantId = dto.tenantId;
      if (dto.email) existing.email = dto.email;
      if (dto.fullName) existing.fullName = dto.fullName;
      if (dto.isActive !== undefined) existing.isActive = dto.isActive;
      if (dto.password) existing.passwordHash = dto.password;

      await this.userRepository.save(existing);
      this.logger.log(`Updated user id=${id}`);
    } catch {
      throw new BadRequestException('Unable to update user');
    }

    return this.findOne(id);
  }

  async inviteUser(dto: InviteUserDto, tenantId: string, invitedBy?: string): Promise<UserInvitationEntity> {
    this.logger.log(`Inviting user email=${dto.email} to tenantId=${tenantId}`);

    const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists in the system');
    }

    const existingInvite = await this.userInvitationRepository.findOne({
      where: { email: dto.email, status: InvitationStatus.PENDING },
    });
    if (existingInvite) {
      throw new BadRequestException('A pending invitation already exists for this email');
    }

    const invite = this.userInvitationRepository.create({
      tenantId,
      email: dto.email,
      roleId: dto.roleId,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: InvitationStatus.PENDING,
      invitedById: invitedBy,
    });
    
    return await this.userInvitationRepository.save(invite);
  }

  async deactivateUser(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);
    user.isActive = false;
    user.deactivatedAt = new Date();
    return await this.userRepository.save(user);
  }

  async reactivateUser(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);
    user.isActive = true;
    user.deactivatedAt = undefined;
    return await this.userRepository.save(user);
  }
}
