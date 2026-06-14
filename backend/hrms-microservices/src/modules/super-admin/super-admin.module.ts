import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity])],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, RolesGuard],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
