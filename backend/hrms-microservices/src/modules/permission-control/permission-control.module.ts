import { Module } from '@nestjs/common';
import { PermissionControlController } from './permission-control.controller';
import { PermissionControlService } from './permission-control.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [PermissionControlController],
  providers: [PermissionControlService, RolesGuard],
  exports: [PermissionControlService],
})
export class PermissionControlModule {}
