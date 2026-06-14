import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { UserInvitationEntity, InvitationStatus } from '../../database/entities/user-invitation.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserInvitationEntity)
    private readonly invitationRepository: Repository<UserInvitationEntity>,
  ) {}

  findAll(): Promise<UserEntity[]> {
    return this.userRepository.find({ order: { createdAt: 'DESC' } });
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

    const entity = this.userRepository.create({
      tenantId: dto.tenantId ?? undefined,
      email: dto.email,
      passwordHash: dto.password,
      fullName: dto.fullName,
      isActive: true,
    } satisfies Partial<UserEntity>);

    try {
      return await this.userRepository.save(entity);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        this.logger.warn(`Failed user create for email=${dto.email}`);
      }
      throw new BadRequestException('Unable to create user');
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const existing = await this.findOne(id);

    const patch: Partial<UserEntity> = {
      tenantId: dto.tenantId ?? existing.tenantId,
      email: dto.email ?? existing.email,
      fullName: dto.fullName ?? existing.fullName,
      isActive: dto.isActive ?? existing.isActive,
      passwordHash: dto.password ?? existing.passwordHash,
    };

    try {
      await this.userRepository.update(id, patch);
      this.logger.log(`Updated user id=${id}`);
    } catch {
      throw new BadRequestException('Unable to update user');
    }

    return this.findOne(id);
  }

  async inviteUser(dto: InviteUserDto, tenantId: string, invitedBy?: string): Promise<UserInvitationEntity> {
    this.logger.log(`Inviting user email=${dto.email} to tenantId=${tenantId}`);

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists in the system');
    }

    // Check for existing pending invitation
    const existingInvite = await this.invitationRepository.findOne({
      where: { email: dto.email, status: InvitationStatus.PENDING },
    });
    if (existingInvite) {
      throw new BadRequestException('A pending invitation already exists for this email');
    }

    const invitation = this.invitationRepository.create({
      tenantId,
      email: dto.email,
      roleId: dto.roleId,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: InvitationStatus.PENDING,
      invitedById: invitedBy,
    });

    return await this.invitationRepository.save(invitation);
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
    user.deactivatedAt = null as any;
    return await this.userRepository.save(user);
  }
}
