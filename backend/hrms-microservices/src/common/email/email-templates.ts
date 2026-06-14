/**
 * email-templates.ts
 *
 * All transactional email HTML templates for Akul Dravin HRMS.
 * Returns { subject, htmlBody, textBody } — pass directly to EmailSenderService.send().
 *
 * Design: Minimal, dark-on-light, readable on all email clients.
 * No external CDN dependencies — inline CSS only.
 */

const brand = process.env.NEXT_PUBLIC_APP_NAME ?? 'Akul Dravin HRMS';
const appUrl = process.env.APP_URL ?? 'https://app.akuldravin.com';

function baseWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${brand}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0"
  style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
  <tr><td style="background:#0f172a;padding:28px 40px;">
    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-.5px;">${brand}</span>
  </td></tr>
  <tr><td style="padding:36px 40px 28px;">${content}</td></tr>
  <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:12px;color:#94a3b8;">
      © ${new Date().getFullYear()} Akul Dravin Pvt. Ltd. &nbsp;·&nbsp;
      <a href="${appUrl}" style="color:#64748b;text-decoration:none;">Visit Dashboard</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3;">${text}</h1>`;
}
function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">${text}</p>`;
}
function btn(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;margin:8px 0 20px;padding:12px 28px;
    background:#0f172a;color:#fff;border-radius:8px;font-size:14px;font-weight:600;
    text-decoration:none;">${text}</a>`;
}
function kv(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;color:#64748b;white-space:nowrap;">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:#1e293b;font-weight:600;">${value}</td>
  </tr>`;
}
function table(...rows: string[]) {
  return `<table cellpadding="0" cellspacing="0" width="100%"
    style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;">
    <tbody>${rows.join('')}</tbody>
  </table>`;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface WelcomeEmailOptions {
  fullName: string;
  email:    string;
}

export function welcomeEmail(opts: WelcomeEmailOptions) {
  const subject = `Welcome to ${brand} — Your account is ready`;
  const htmlBody = baseWrapper(
    h1(`Welcome, ${opts.fullName}! 👋`) +
    p(`Your <strong>${brand}</strong> account has been successfully created.
       You're now set up as the Company Administrator for your organisation.`) +
    btn('Go to Dashboard', appUrl) +
    p(`Your login email is: <strong>${opts.email}</strong>`) +
    p(`If you have any questions, reply to this email — we're here to help.`),
  );
  const textBody = `Welcome to ${brand}, ${opts.fullName}!\n\nYour account is ready.\nDashboard: ${appUrl}\nLogin: ${opts.email}`;
  return { subject, htmlBody, textBody };
}

// ─────────────────────────────────────────────────────────────────────────────

export interface LeaveStatusEmailOptions {
  employeeName: string;
  status:       'approved' | 'rejected';
  leaveType:    string;
  fromDate:     string;
  toDate:       string;
  approverName?: string;
  reason?:      string;
}

export function leaveStatusEmail(opts: LeaveStatusEmailOptions) {
  const isApproved = opts.status === 'approved';
  const subject = `Leave Request ${isApproved ? 'Approved ✅' : 'Rejected ❌'} — ${brand}`;
  const htmlBody = baseWrapper(
    h1(`Leave Request ${isApproved ? 'Approved' : 'Rejected'}`) +
    p(`Hi ${opts.employeeName}, your leave request has been <strong>${opts.status}</strong>.`) +
    table(
      kv('Leave Type', opts.leaveType),
      kv('From', opts.fromDate),
      kv('To', opts.toDate),
      kv('Status', isApproved ? '✅ Approved' : '❌ Rejected'),
      ...(opts.approverName ? [kv('Approved by', opts.approverName)] : []),
      ...(opts.reason ? [kv('Reason', opts.reason)] : []),
    ) +
    btn('View Leave Details', `${appUrl}/leave`),
  );
  const textBody =
    `Leave ${opts.status} — ${opts.leaveType} from ${opts.fromDate} to ${opts.toDate}.`;
  return { subject, htmlBody, textBody };
}

// ─────────────────────────────────────────────────────────────────────────────

export interface PayrollCompletionEmailOptions {
  employeeName: string;
  month:        string;      // e.g. "April 2026"
  grossPay:     string;
  netPay:       string;
  currency:     string;
}

export function payrollCompletionEmail(opts: PayrollCompletionEmailOptions) {
  const subject = `Your Payslip for ${opts.month} is Ready — ${brand}`;
  const htmlBody = baseWrapper(
    h1(`Payslip Ready — ${opts.month}`) +
    p(`Hi ${opts.employeeName}, your salary for <strong>${opts.month}</strong> has been processed.`) +
    table(
      kv('Period', opts.month),
      kv('Gross Pay', `${opts.currency} ${opts.grossPay}`),
      kv('Net Pay', `${opts.currency} ${opts.netPay}`),
    ) +
    btn('Download Payslip', `${appUrl}/payroll`) +
    p('If you have any questions about your payslip, please contact HR.'),
  );
  const textBody =
    `Payslip for ${opts.month}: Gross ${opts.currency} ${opts.grossPay}, Net ${opts.currency} ${opts.netPay}. Download at: ${appUrl}/payroll`;
  return { subject, htmlBody, textBody };
}
