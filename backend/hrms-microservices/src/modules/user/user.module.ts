import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../../database/entities/user.entity';
import { UserInvitationEntity } from '../../database/entities/user-invitation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserInvitationEntity])],
  controllers: [UserController],
  providers: [UserService, RolesGuard],
  exports: [UserService],
})
export class UserModule {}
