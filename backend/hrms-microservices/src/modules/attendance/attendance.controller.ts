import { Body, Controller, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { PunchInDto } from './dto/punch-in.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('summary')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.HR_MANAGER)
  getSummary() {
    return this.attendanceService.getSummary();
  }

  @Post('punch-in')
  @Roles(Role.EMPLOYEE, Role.HR_MANAGER, Role.COMPANY_ADMIN)
  punchIn(@Req() req: any, @Body() dto: PunchInDto) {
    // In a real app, employeeId and companyId should come from the JWT payload
    const { employeeId, companyId } = req.user;
    return this.attendanceService.punchIn(employeeId, companyId, dto);
  }

  @Post('punch-out')
  @Roles(Role.EMPLOYEE, Role.HR_MANAGER, Role.COMPANY_ADMIN)
  punchOut(@Req() req: any) {
    const { employeeId } = req.user;
    return this.attendanceService.punchOut(employeeId);
  }

  @Get()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.HR_MANAGER)
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Post()
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN)
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    // In service layer, we would do findOne(id) then merge/save
    // For now, simple update
    return this.attendanceService.findOne(id).then(record => {
        // Logic to update record here
    });
  }
}
