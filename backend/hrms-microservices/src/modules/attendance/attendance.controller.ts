import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.HR_MANAGER)
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.BRANCH_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Post()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
  create(@Body() payload: Partial<AttendanceEntity>) {
    return this.attendanceService.create(payload);
  }

  @Patch(':id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.HR_MANAGER)
  update(@Param('id') id: string, @Body() payload: Partial<AttendanceEntity>) {
    return this.attendanceService.update(id, payload);
  }
}
