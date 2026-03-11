import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';

@Controller('leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  create(@Body() data: any) {
    return this.leaveRequestService.create(data);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.leaveRequestService.findAll(filters);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() body: { approverId: string; remarks?: string }) {
    return this.leaveRequestService.approve(id, body.approverId, body.remarks);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { approverId: string; remarks: string }) {
    return this.leaveRequestService.reject(id, body.approverId, body.remarks);
  }

  @Get('balance/:employeeId/:leaveTypeId')
  getBalance(@Param('employeeId') employeeId: string, @Param('leaveTypeId') leaveTypeId: string) {
    return this.leaveRequestService.getBalance(employeeId, leaveTypeId);
  }
}
