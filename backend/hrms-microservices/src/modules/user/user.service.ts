import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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

    const hashed = await bcrypt.hash(dto.password, 10);
    const entity = this.userRepository.create({
      tenantId: dto.tenantId ?? null,
      email: dto.email,
      passwordHash: hashed,
      fullName: dto.fullName,
      role: dto.role,
      isActive: true,
    });

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
      role: dto.role ?? existing.role,
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
}
