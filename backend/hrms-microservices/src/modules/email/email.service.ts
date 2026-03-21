import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendInterviewInvite(to: string, candidateName: string, jobTitle: string, companyName: string) {
    await this.send(to, `Interview Invitation – ${jobTitle} at ${companyName}`, `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1d4ed8">Congratulations, ${candidateName}!</h2>
        <p>We are pleased to inform you that your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been shortlisted.</p>
        <p>You have been selected for an interview. Our team will reach out shortly with the interview schedule and details.</p>
        <p>Please keep an eye on your email and be prepared.</p>
        <br/>
        <p style="color:#6b7280;font-size:13px">This is an automated message from ${companyName} via Akul Dravin HRMS.</p>
      </div>
    `);
  }

  async sendLoginCredentials(to: string, candidateName: string, jobTitle: string, companyName: string, password: string) {
    await this.send(to, `Welcome to ${companyName} – Your Login Credentials`, `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#16a34a">Welcome aboard, ${candidateName}!</h2>
        <p>You have been selected for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>. Congratulations!</p>
        <p>Your employee account has been created. Please use the credentials below to log in:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0">
          <p style="margin:4px 0"><strong>Email:</strong> ${to}</p>
          <p style="margin:4px 0"><strong>Password:</strong> ${password}</p>
        </div>
        <p>Login at: <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/login">${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/login</a></p>
        <p>After logging in, you can download your offer letter and other documents from the Documents section.</p>
        <br/>
        <p style="color:#6b7280;font-size:13px">Please change your password after first login. This is an automated message from ${companyName} via Akul Dravin HRMS.</p>
      </div>
    `);
  }

  async sendTaskAssigned(to: string, employeeName: string, taskTitle: string, dueDate: string) {
    await this.send(to, `New Task Assigned: ${taskTitle}`, `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1d4ed8">New Task Assigned</h2>
        <p>Hi ${employeeName},</p>
        <p>A new task has been assigned to you:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0">
          <p style="margin:4px 0"><strong>Task:</strong> ${taskTitle}</p>
          <p style="margin:4px 0"><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <p>Login to your dashboard to view full details and update the task status.</p>
        <br/>
        <p style="color:#6b7280;font-size:13px">This is an automated message from Akul Dravin HRMS.</p>
      </div>
    `);
  }

  async sendPayslipReady(to: string, employeeName: string, month: string) {
    await this.send(to, `Your Payslip for ${month} is Ready`, `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1d4ed8">Payslip Available</h2>
        <p>Hi ${employeeName},</p>
        <p>Your payslip for <strong>${month}</strong> is now available. Please log in to your dashboard to view and download it.</p>
        <p>Login at: <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/login">${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/login</a></p>
        <br/>
        <p style="color:#6b7280;font-size:13px">This is an automated message from Akul Dravin HRMS.</p>
      </div>
    `);
  }

  private async send(to: string, subject: string, html: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(`Email not sent to ${to} — SMTP_USER/SMTP_PASS not configured in .env`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME ?? 'Akul Dravin HRMS'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }
}
