import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionControlController } from './permission-control.controller';
import { PermissionControlService } from './permission-control.service';
import { RoleEntity } from '../../database/entities/role.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, PermissionEntity])],
  controllers: [PermissionControlController],
  providers: [PermissionControlService],
  exports: [PermissionControlService],
})
export class PermissionControlModule {}
