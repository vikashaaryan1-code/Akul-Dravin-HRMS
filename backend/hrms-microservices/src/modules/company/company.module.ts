import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from '../../database/entities/company.entity';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  controllers: [CompanyController],
  providers: [CompanyService, RolesGuard],
  exports: [CompanyService],
})
export class CompanyModule {}
