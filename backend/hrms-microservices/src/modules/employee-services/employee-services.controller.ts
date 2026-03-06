import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { EmployeeServicesService } from './employee-services.service';
import { CreateEmployeeServiceTicketDto } from './dto/create-employee-service-ticket.dto';
import { UpdateEmployeeServiceTicketDto } from './dto/update-employee-service-ticket.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employee-services')
export class EmployeeServicesController {
  constructor(private readonly employeeServicesService: EmployeeServicesService) {}

  @Get('tickets')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  findAllTickets() {
    return this.employeeServicesService.findAllTickets();
  }

  @Get('tickets/:id')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  findTicket(@Param('id') id: string) {
    return this.employeeServicesService.findTicket(id);
  }

  @Post('tickets')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  createTicket(@Body() dto: CreateEmployeeServiceTicketDto) {
    return this.employeeServicesService.createTicket(dto);
  }

  @Patch('tickets/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  updateTicket(@Param('id') id: string, @Body() dto: UpdateEmployeeServiceTicketDto) {
    return this.employeeServicesService.updateTicket(id, dto);
  }

  @Patch('tickets/:id/resolve')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  resolveTicket(@Param('id') id: string, @Body() dto: UpdateEmployeeServiceTicketDto) {
    return this.employeeServicesService.resolveTicket(id, dto);
  }
}
