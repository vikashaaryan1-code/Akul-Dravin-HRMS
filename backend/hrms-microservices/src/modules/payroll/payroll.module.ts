import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollBatchEntity } from '../../database/entities/payroll-batch.entity';
import { PayrollItemEntity } from '../../database/entities/payroll-item.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { BankFileArtifactEntity } from '../../database/entities/bank-file-artifact.entity';
import { AttendanceModule } from '../attendance/attendance.module';
import { PerformanceManagementModule } from '../performance-management/performance-management.module';
import { EmployeeModule } from '../employee/employee.module';
import { FinanceModule } from '../finance/finance.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([PayrollBatchEntity, PayrollItemEntity, EmployeeEntity, AttendanceEntity]),
    AttendanceModule,
    PerformanceManagementModule,
    EmployeeModule,
    FinanceModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService, RolesGuard],
  exports: [PayrollService],
})
export class PayrollModule {}
