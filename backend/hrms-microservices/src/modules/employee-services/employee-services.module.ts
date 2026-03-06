import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmployeeServiceTicketEntity } from '../../database/entities/employee-service-ticket.entity';
import { EmployeeServicesController } from './employee-services.controller';
import { EmployeeServicesService } from './employee-services.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeServiceTicketEntity])],
  controllers: [EmployeeServicesController],
  providers: [EmployeeServicesService, RolesGuard],
  exports: [EmployeeServicesService],
})
export class EmployeeServicesModule {}
