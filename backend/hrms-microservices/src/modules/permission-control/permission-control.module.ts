import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionControlController } from './permission-control.controller';
import { PermissionControlService } from './permission-control.service';
import { RoleEntity } from '../../database/entities/role.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, PermissionEntity, AuditLogEntity])],
  controllers: [PermissionControlController],
  providers: [PermissionControlService],
  exports: [PermissionControlService],
})
export class PermissionControlModule {}
