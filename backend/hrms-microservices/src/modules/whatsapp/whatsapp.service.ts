import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class WhatsappService {
  private client: twilio.Twilio;
  private whatsappNumber: string;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID || 'AC_test',
      process.env.TWILIO_AUTH_TOKEN || 'test_token'
    );
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  }

  async sendMessage(to: string, message: string) {
    try {
      const result = await this.client.messages.create({
        from: this.whatsappNumber,
        to: `whatsapp:${to}`,
        body: message,
      });
      return { success: true, messageId: result.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendLeaveApprovalNotification(employeeName: string, phone: string, leaveType: string, dates: string) {
    const message = `Hi ${employeeName},\n\nYour ${leaveType} request for ${dates} has been approved.\n\nRegards,\nHR Team`;
    return await this.sendMessage(phone, message);
  }

  async sendPayslipNotification(employeeName: string, phone: string, month: string) {
    const message = `Hi ${employeeName},\n\nYour payslip for ${month} is now available. Please check your dashboard.\n\nRegards,\nHR Team`;
    return await this.sendMessage(phone, message);
  }

  async sendInterviewScheduleNotification(candidateName: string, phone: string, date: string, time: string, position: string) {
    const message = `Hi ${candidateName},\n\nYour interview for ${position} is scheduled on ${date} at ${time}.\n\nGood luck!\nHR Team`;
    return await this.sendMessage(phone, message);
  }

  async sendOfferLetterNotification(candidateName: string, phone: string, position: string) {
    const message = `Congratulations ${candidateName}!\n\nWe are pleased to offer you the position of ${position}. Please check your email for the offer letter.\n\nRegards,\nHR Team`;
    return await this.sendMessage(phone, message);
  }

  async sendAttendanceReminder(employeeName: string, phone: string) {
    const message = `Hi ${employeeName},\n\nReminder: Please mark your attendance for today.\n\nRegards,\nHR Team`;
    return await this.sendMessage(phone, message);
  }

  async sendBulkMessage(recipients: { name: string; phone: string }[], message: string) {
    const results = [];
    for (const recipient of recipients) {
      const personalizedMessage = message.replace('{name}', recipient.name);
      const result = await this.sendMessage(recipient.phone, personalizedMessage);
      results.push({ ...recipient, ...result });
    }
    return results;
  }
}
