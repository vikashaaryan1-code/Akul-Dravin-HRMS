import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { PunchInDto } from './dto/punch-in.dto';
import { BiometricSyncDto } from './dto/biometric-sync.dto';
import { FacePunchDto } from './dto/face-punch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const ATTENDANCE_ADMIN_ROLES = [
  Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.HR_MANAGER,
];

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('summary')
  @Roles(...ATTENDANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Get attendance summary for the tenant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance summary returned' })
  getSummary() {
    return this.attendanceService.getSummary();
  }

  @Post('punch-in')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.EMPLOYEE, Role.HR_MANAGER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Employee punch-in with optional GPS coordinates' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Punch-in recorded successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Already punched in today' })
  punchIn(
    @Request() req: { user: { employeeId?: string; sub: string; companyId?: string; tenantId: string } },
    @Body() dto: PunchInDto,
  ) {
    const employeeId = req.user.employeeId ?? req.user.sub;
    const companyId  = req.user.companyId ?? req.user.tenantId;
    return this.attendanceService.punchIn(employeeId, companyId, dto);
  }

  @Post('punch-out')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.EMPLOYEE, Role.HR_MANAGER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Employee punch-out' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Punch-out recorded successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No active punch-in record found' })
  punchOut(@Request() req: { user: { employeeId?: string; sub: string } }) {
    const employeeId = req.user.employeeId ?? req.user.sub;
    return this.attendanceService.punchOut(employeeId);
  }

  @Get()
  @Roles(...ATTENDANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Get all attendance records for the tenant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance records returned' })
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get(':id')
  @Roles(...ATTENDANCE_ADMIN_ROLES, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get a specific attendance record by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance record returned' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, ...ATTENDANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Manually create an attendance record (admin override)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Attendance record created successfully' })
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.HR_MANAGER, Role.COMPANY_ADMIN, ...ATTENDANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Update an attendance record (regularisation)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance record updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(id, dto);
  }

  @Post('biometric/sync')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Synchronize attendance logs from physical biometric devices' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Biometric sync processed' })
  async syncBiometric(@Body() dto: BiometricSyncDto) {
    return this.attendanceService.syncBiometric(dto);
  }

  @Post('face-recognition/punch')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.EMPLOYEE, Role.HR_MANAGER, Role.COMPANY_ADMIN, ...ATTENDANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Punch in/out using visual face recognition identity profile matching' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Face verification punch processed' })
  async punchFace(@Body() dto: FacePunchDto) {
    return this.attendanceService.punchFace(dto);
  }
}
