import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Body() body: { employeeId: string; location?: { lat: number; lng: number; address: string } }) {
    return this.attendanceService.checkIn(body.employeeId, body.location);
  }

  @Post('check-out')
  checkOut(@Body() body: { employeeId: string; location?: { lat: number; lng: number; address: string } }) {
    return this.attendanceService.checkOut(body.employeeId, body.location);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.attendanceService.findAll(filters);
  }

  @Get('stats/:employeeId')
  getStats(@Param('employeeId') employeeId: string, @Query('month') month: string, @Query('year') year: string) {
    return this.attendanceService.getStats(employeeId, month, parseInt(year));
  }
}
