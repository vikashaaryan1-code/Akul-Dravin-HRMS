import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userPayload = request.user;

    if (!userPayload || !userPayload.sub) {
      return false;
    }

    // Resolve User and their Role with Permissions
    // In a production system, this should be cached (Redis) to avoid DB hits on every request
    const user = await this.dataSource.getRepository(UserEntity).findOne({
      where: { id: userPayload.sub, tenantId: userPayload.tenantId },
      relations: ['role', 'role.permissions'],
    });

    if (!user || !user.isActive || !user.role) {
      throw new ForbiddenException('User is inactive or has no assigned role');
    }

    const userPermissions = user.role.permissions.map((p) => p.slug);
    
    // Check if user has ALL required permissions
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to perform this action');
    }

    return true;
  }
}
