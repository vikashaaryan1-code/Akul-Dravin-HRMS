import { Controller, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('api/v1/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send')
  async sendMessage(@Body() body: { to: string; message: string }) {
    return await this.whatsappService.sendMessage(body.to, body.message);
  }

  @Post('leave-approval')
  async sendLeaveApproval(@Body() body: { employeeName: string; phone: string; leaveType: string; dates: string }) {
    return await this.whatsappService.sendLeaveApprovalNotification(
      body.employeeName,
      body.phone,
      body.leaveType,
      body.dates
    );
  }

  @Post('payslip')
  async sendPayslip(@Body() body: { employeeName: string; phone: string; month: string }) {
    return await this.whatsappService.sendPayslipNotification(body.employeeName, body.phone, body.month);
  }

  @Post('interview-schedule')
  async sendInterviewSchedule(@Body() body: { candidateName: string; phone: string; date: string; time: string; position: string }) {
    return await this.whatsappService.sendInterviewScheduleNotification(
      body.candidateName,
      body.phone,
      body.date,
      body.time,
      body.position
    );
  }

  @Post('offer-letter')
  async sendOfferLetter(@Body() body: { candidateName: string; phone: string; position: string }) {
    return await this.whatsappService.sendOfferLetterNotification(body.candidateName, body.phone, body.position);
  }

  @Post('attendance-reminder')
  async sendAttendanceReminder(@Body() body: { employeeName: string; phone: string }) {
    return await this.whatsappService.sendAttendanceReminder(body.employeeName, body.phone);
  }

  @Post('bulk')
  async sendBulkMessage(@Body() body: { recipients: { name: string; phone: string }[]; message: string }) {
    return await this.whatsappService.sendBulkMessage(body.recipients, body.message);
  }
}
