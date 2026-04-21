import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { UserInvitationEntity } from '../../database/entities/user-invitation.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserInvitationEntity, RoleEntity, PermissionEntity])],
  controllers: [UserController],
  providers: [UserService, RolesGuard],
  exports: [UserService],
})
export class UserModule {}
