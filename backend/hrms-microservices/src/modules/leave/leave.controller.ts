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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

const LEAVE_READ_ROLES = [
  Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.BRANCH_ADMIN,
];

@ApiTags('Leave Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get('types')
  @Roles(...LEAVE_READ_ROLES)
  @ApiOperation({ summary: 'Get all leave types for the tenant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leave types returned successfully' })
  findAllTypes() {
    return this.leaveService.findAllLeaveTypes();
  }

  @Post('types')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Create a new leave type (e.g. Annual, Sick, Casual)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Leave type created successfully' })
  createType(@Body() dto: CreateLeaveTypeDto) {
    return this.leaveService.createLeaveType(dto);
  }

  @Get('requests')
  @Roles(...LEAVE_READ_ROLES)
  @ApiOperation({ summary: 'Get all leave requests for the tenant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leave requests returned successfully' })
  findAllRequests() {
    return this.leaveService.findAllLeaveRequests();
  }

  @Get('requests/:id')
  @Roles(...LEAVE_READ_ROLES)
  @ApiOperation({ summary: 'Get a specific leave request by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leave request returned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Leave request not found' })
  findOneRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveService.findLeaveRequest(id);
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...LEAVE_READ_ROLES, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Submit a new leave request' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Leave request submitted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error or insufficient balance' })
  createRequest(@Body() dto: CreateLeaveRequestDto) {
    return this.leaveService.createLeaveRequest(dto);
  }

  @Patch('requests/:id/status')
  @Roles(...LEAVE_READ_ROLES)
  @ApiOperation({ summary: 'Approve or reject a leave request' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leave request status updated' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveRequestDto,
  ) {
    return this.leaveService.updateLeaveRequestStatus(id, dto);
  }
}
