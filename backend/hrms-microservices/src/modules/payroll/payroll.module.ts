import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollEntity } from '../../database/entities/payroll.entity';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([PayrollEntity])],
  controllers: [PayrollController],
  providers: [PayrollService, RolesGuard],
  exports: [PayrollService],
})
export class PayrollModule {}
