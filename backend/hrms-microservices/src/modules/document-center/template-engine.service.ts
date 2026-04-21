import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { DocumentType, DesignMode } from './dto/render-document.dto';
import type { RenderDocumentDto } from './dto/render-document.dto';

/**
 * OMNIX Document Template Engine
 * Generates HTML strings for each document type.
 * HTML is then passed to the PDF renderer.
 */

@Injectable()
export class TemplateEngineService {
  private readonly logger = new Logger(TemplateEngineService.name);

  /**
   * Route to the correct template based on DocumentType
   */
  render(dto: RenderDocumentDto, verificationHash: string, qrDataUrl?: string): string {
    const mode = dto.design ?? DesignMode.PRINT_CLEAN;
    const { employee: emp, company: co } = dto;

    this.logger.log(`Rendering template type=${dto.type} design=${mode}`);

    switch (dto.type) {
      case DocumentType.OFFER_LETTER:
      case DocumentType.APPOINTMENT_LETTER:
        return this.renderOfferLetter(dto, verificationHash, qrDataUrl);

      case DocumentType.EXPERIENCE_LETTER:
      case DocumentType.RELIEVING_LETTER:
        return this.renderExperienceLetter(dto, verificationHash, qrDataUrl);

      case DocumentType.SALARY_SLIP:
        return this.renderSalarySlip(dto, verificationHash, qrDataUrl);

      case DocumentType.SALARY_CERTIFICATE:
        return this.renderSalaryCertificate(dto, verificationHash, qrDataUrl);

      case DocumentType.CONFIRMATION_LETTER:
      case DocumentType.PROMOTION_LETTER:
      case DocumentType.INCREMENT_LETTER:
      case DocumentType.TRANSFER_LETTER:
      case DocumentType.WARNING_LETTER:
      case DocumentType.TERMINATION_LETTER:
        return this.renderLetterBase(dto, verificationHash, qrDataUrl);

      case DocumentType.INTERNSHIP_OFFER:
        return this.renderOfferLetter({ ...dto, custom: { ...dto.custom, isInternship: true } }, verificationHash, qrDataUrl);

      case DocumentType.INTERNSHIP_CERTIFICATE:
      case DocumentType.INTERNSHIP_EXPERIENCE:
      case DocumentType.BONAFIDE_CERTIFICATE:
        return this.renderCertificate(dto, verificationHash, qrDataUrl);

      case DocumentType.ID_CARD:
        return this.renderIdCard(dto, verificationHash, qrDataUrl);

      case DocumentType.VISITING_CARD:
        return this.renderVisitingCard(dto, verificationHash, qrDataUrl);

      default:
        return this.renderLetterBase(dto, verificationHash, qrDataUrl);
    }
  }

  // =========================================================
  // Shared Layout Wrapper
  // =========================================================
  private pageWrapper(title: string, body: string, design: DesignMode): string {
    const isPrint = design === DesignMode.PRINT_CLEAN;
    const bg = isPrint
      ? '#ffffff'
      : 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)';
    const color = isPrint ? '#1a1a2e' : '#f8fafc';
    const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap');`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    ${fontImport}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: ${bg};
      color: ${color};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      background: ${isPrint ? '#fff' : 'rgba(255,255,255,0.04)'};
      ${isPrint ? 'border: 1px solid #e5e7eb;' : 'border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; backdrop-filter: blur(20px);'}
      padding: 64px;
      position: relative;
      overflow: hidden;
    }
    .header-bar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 28px;
      border-bottom: ${isPrint ? '3px solid #7C3AED' : '1px solid rgba(255,255,255,0.1)'};
      margin-bottom: 48px;
    }
    .company-name {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: ${isPrint ? '#7C3AED' : '#a78bfa'};
      letter-spacing: -0.5px;
    }
    .company-meta { font-size: 10px; color: ${isPrint ? '#6b7280' : '#94a3b8'}; margin-top: 2px; }
    .doc-title {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -1px;
      margin-bottom: 8px;
      color: ${isPrint ? '#111827' : '#f8fafc'};
    }
    .doc-subtitle { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: ${isPrint ? '#7C3AED' : '#a78bfa'}; margin-bottom: 32px; }
    .body-text { font-size: 13.5px; line-height: 1.85; color: ${isPrint ? '#374151' : '#cbd5e1'}; }
    .field-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: baseline; }
    .field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${isPrint ? '#9ca3af' : '#64748b'}; min-width: 140px; }
    .field-value { font-size: 13.5px; font-weight: 600; color: ${isPrint ? '#111827' : '#f8fafc'}; }
    .highlight-box {
      background: ${isPrint ? '#f5f3ff' : 'rgba(124,58,237,0.08)'};
      border: 1px solid ${isPrint ? '#ddd6fe' : 'rgba(124,58,237,0.2)'};
      border-radius: 12px;
      padding: 20px 24px;
      margin: 24px 0;
    }
    .footer-section {
      margin-top: 64px;
      padding-top: 32px;
      border-top: ${isPrint ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.06)'};
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .signature-block { text-align: left; }
    .signature-name { font-weight: 800; font-size: 13px; color: ${isPrint ? '#111827' : '#f8fafc'}; }
    .signature-role { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: ${isPrint ? '#6b7280' : '#64748b'}; }
    .qr-block { text-align: right; }
    .qr-block img { width: 72px; height: 72px; opacity: 0.85; }
    .verify-hash { font-size: 9px; font-family: monospace; color: ${isPrint ? '#9ca3af' : '#475569'}; margin-top: 4px; word-break: break-all; max-width: 200px; }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(124,58,237,0.04);
      pointer-events: none;
      white-space: nowrap;
      font-family: 'Outfit', sans-serif;
      text-transform: uppercase;
    }
    .corner-accent {
      position: absolute;
      top: 0;
      right: 0;
      width: 180px;
      height: 180px;
      background: ${isPrint ? 'radial-gradient(circle at top right, #f5f3ff, transparent)' : 'radial-gradient(circle at top right, rgba(124,58,237,0.1), transparent)'};
      pointer-events: none;
    }
    @media print {
      body { background: #fff !important; }
      .page { border: none; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="corner-accent"></div>
    <div class="watermark">OMNIX</div>
    ${body}
  </div>
</body>
</html>`;
  }

  // =========================================================
  // 1. Offer / Appointment Letter
  // =========================================================
  private renderOfferLetter(dto: RenderDocumentDto, hash: string, qrDataUrl?: string): string {
    const { employee: emp, company: co } = dto;
    const isInternship = dto.custom?.['isInternship'] === true;
    const design = dto.design ?? DesignMode.PRINT_CLEAN;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const title = isInternship ? 'Internship Offer Letter' : 'Offer Letter';

    const body = `
      <div class="header-bar">
        <div>
          <div class="company-name">${co.name}</div>
          <div class="company-meta">${co.address ?? ''} ${co.website ? '| ' + co.website : ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7C3AED;">CONFIDENTIAL</div>
          <div style="font-size:10px;color:#9ca3af;margin-top:4px;">Date: ${today}</div>
        </div>
      </div>

      <div class="doc-title">${title}</div>
      <div class="doc-subtitle">${co.name} — Formal Employment Offer</div>

      <div class="body-text">
        <p style="margin-bottom:16px;">Dear <strong>${emp.name}</strong>,</p>
        <p style="margin-bottom:16px;">
          We are pleased to extend this offer of ${isInternship ? 'internship' : 'employment'} at
          <strong>${co.name}</strong>. Following a thorough selection process, we are delighted to
          invite you to join our team.
        </p>
      </div>

      <div class="highlight-box">
        <div class="field-row"><span class="field-label">Position</span><span class="field-value">${emp.designation ?? '—'}</span></div>
        <div class="field-row"><span class="field-label">Department</span><span class="field-value">${emp.department ?? '—'}</span></div>
        <div class="field-row"><span class="field-label">Date of Joining</span><span class="field-value">${emp.joinDate ?? '—'}</span></div>
        ${emp.ctc ? `<div class="field-row"><span class="field-label">CTC Per Annum</span><span class="field-value">₹${emp.ctc.toLocaleString('en-IN')}</span></div>` : ''}
        ${emp.gross ? `<div class="field-row"><span class="field-label">Gross Monthly</span><span class="field-value">₹${emp.gross.toLocaleString('en-IN')}</span></div>` : ''}
      </div>

      <div class="body-text">
        <p style="margin-bottom:12px;">
          This offer is subject to the terms and conditions outlined in the employment agreement and is
          contingent upon the successful completion of documentation, background verification, and
          any applicable regulatory requirements.
        </p>
        <p style="margin-bottom:12px;">
          Please confirm your acceptance by signing this letter and returning it on or before your date of joining.
          We look forward to welcoming you to the <strong>${co.name}</strong> family.
        </p>
        <p>Warm regards,</p>
      </div>

      ${this.footerSection(co, hash, qrDataUrl, dto.includeStamp, dto.includeSignature)}
    `;

    return this.pageWrapper(title, body, design);
  }

  // =========================================================
  // 2. Experience / Relieving Letter
  // =========================================================
  private renderExperienceLetter(dto: RenderDocumentDto, hash: string, qrDataUrl?: string): string {
    const { employee: emp, company: co } = dto;
    const design = dto.design ?? DesignMode.PRINT_CLEAN;
    const isRelieving = dto.type === DocumentType.RELIEVING_LETTER;
    const title = isRelieving ? 'Relieving Letter' : 'Experience Letter';
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const body = `
      <div class="header-bar">
        <div>
          <div class="company-name">${co.name}</div>
          <div class="company-meta">${co.address ?? ''}</div>
        </div>
        <div style="text-align:right;font-size:10px;color:#9ca3af;">Date: ${today}</div>
      </div>

      <div class="doc-title">${title}</div>
      <div class="doc-subtitle">To Whom It May Concern</div>

      <div class="body-text" style="margin-bottom:24px;">
        <p style="margin-bottom:16px;">This is to certify that <strong>${emp.name}</strong>
        ${emp.employeeId ? `(Employee ID: <strong>${emp.employeeId}</strong>)` : ''} was employed
        at <strong>${co.name}</strong>${emp.joinDate ? ` from <strong>${emp.joinDate}</strong>` : ''}
        ${emp.lastWorkingDay ? ` to <strong>${emp.lastWorkingDay}</strong>` : ''}.
        </p>
      </div>

      <div class="highlight-box">
        <div class="field-row"><span class="field-label">Name</span><span class="field-value">${emp.name}</span></div>
        <div class="field-row"><span class="field-label">Designation</span><span class="field-value">${emp.designation ?? '—'}</span></div>
        <div class="field-row"><span class="field-label">Department</span><span class="field-value">${emp.department ?? '—'}</span></div>
        ${emp.joinDate ? `<div class="field-row"><span class="field-label">Date of Joining</span><span class="field-value">${emp.joinDate}</span></div>` : ''}
        ${emp.lastWorkingDay ? `<div class="field-row"><span class="field-label">Last Working Day</span><span class="field-value">${emp.lastWorkingDay}</span></div>` : ''}
      </div>

      <div class="body-text">
        <p style="margin-bottom:12px;">
          During their tenure, <strong>${emp.name}</strong> demonstrated professionalism, competence,
          and dedication. ${isRelieving ? 'They have been formally relieved from all duties and obligations.' : 'We wish them the very best in their future endeavors.'}
        </p>
        ${isRelieving ? '<p>This letter confirms full and final settlement has been completed per company policy.</p>' : ''}
      </div>

      ${this.footerSection(co, hash, qrDataUrl, dto.includeStamp, dto.includeSignature)}
    `;
    return this.pageWrapper(title, body, design);
  }

  // =========================================================
  // 3. Salary Slip
  // =========================================================
  private renderSalarySlip(dto: RenderDocumentDto, hash: string, qrDataUrl?: string): string {
    const { employee: emp, company: co } = dto;
    const design = dto.design ?? DesignMode.PRINT_CLEAN;
    const custom = dto.custom ?? {};
    const month = (custom['month'] as string) ?? new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const basic = (emp.gross ?? 0) * 0.4;
    const hra = (emp.gross ?? 0) * 0.2;
    const da = (emp.gross ?? 0) * 0.15;
    const specialAllow = (emp.gross ?? 0) * 0.15;
    const conveyance = (emp.gross ?? 0) * 0.1;
    const pf = basic * 0.12;
    const tds = (emp.gross ?? 0) * 0.05;
    const netPay = (emp.net ?? (emp.gross ?? 0) - pf - tds);

    const body = `
      <div class="header-bar">
        <div>
          <div class="company-name">${co.name}</div>
          <div class="company-meta">${co.address ?? ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7C3AED;">PAYSLIP</div>
          <div style="font-size:10px;color:#9ca3af;">${month}</div>
        </div>
      </div>

      <div class="doc-title">Salary Slip</div>
      <div class="doc-subtitle">For the period: ${month}</div>

      <div class="highlight-box" style="margin-bottom:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 32px;">
          <div class="field-row"><span class="field-label">Employee Name</span><span class="field-value">${emp.name}</span></div>
          <div class="field-row"><span class="field-label">Employee ID</span><span class="field-value">${emp.employeeId ?? '—'}</span></div>
          <div class="field-row"><span class="field-label">Designation</span><span class="field-value">${emp.designation ?? '—'}</span></div>
          <div class="field-row"><span class="field-label">Department</span><span class="field-value">${emp.department ?? '—'}</span></div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;">
        <thead>
          <tr style="background:#7C3AED;color:#fff;">
            <th style="padding:10px 14px;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Earnings</th>
            <th style="padding:10px 14px;text-align:right;font-weight:700;">Amount (₹)</th>
            <th style="padding:10px 14px;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Deductions</th>
            <th style="padding:10px 14px;text-align:right;font-weight:700;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Basic Salary', basic.toFixed(0), 'PF (Employee 12%)', pf.toFixed(0)],
            ['HRA', hra.toFixed(0), 'TDS', tds.toFixed(0)],
            ['Dearness Allowance', da.toFixed(0), 'Professional Tax', '200'],
            ['Special Allowance', specialAllow.toFixed(0), '', ''],
            ['Conveyance', conveyance.toFixed(0), '', ''],
          ].map((row, i) => `
            <tr style="background:${i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'};">
              <td style="padding:9px 14px;color:#374151;">${row[0]}</td>
              <td style="padding:9px 14px;text-align:right;font-weight:600;">${row[1] ? '₹' + Number(row[1]).toLocaleString('en-IN') : ''}</td>
              <td style="padding:9px 14px;color:#374151;">${row[2]}</td>
              <td style="padding:9px 14px;text-align:right;font-weight:600;">${row[3] ? '₹' + Number(row[3]).toLocaleString('en-IN') : ''}</td>
            </tr>
          `).join('')}
          <tr style="background:#f5f3ff;font-weight:800;border-top:2px solid #7C3AED;">
            <td style="padding:12px 14px;color:#7C3AED;">Gross Earnings</td>
            <td style="padding:12px 14px;text-align:right;color:#7C3AED;">₹${(emp.gross ?? 0).toLocaleString('en-IN')}</td>
            <td style="padding:12px 14px;color:#dc2626;">Total Deductions</td>
            <td style="padding:12px 14px;text-align:right;color:#dc2626;">₹${(pf + tds + 200).toFixed(0)}</td>
          </tr>
        </tbody>
      </table>

      <div style="background:#7C3AED;border-radius:12px;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;color:#fff;">
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.7;">Net Take-Home Salary</div>
          <div style="font-family:'Outfit',sans-serif;font-size:28px;font-weight:900;letter-spacing:-1px;">₹${netPay.toLocaleString('en-IN')}</div>
        </div>
        <div style="text-align:right;font-size:10px;opacity:0.8;">
          <div>Generated: ${new Date().toLocaleDateString('en-IN')}</div>
          <div style="font-family:monospace;margin-top:4px;">${hash.substring(0, 12).toUpperCase()}</div>
        </div>
      </div>

      ${this.footerSection(co, hash, qrDataUrl, dto.includeStamp, false)}
    `;
    return this.pageWrapper('Salary Slip', body, design);
  }

  // =========================================================
  // 4. Salary Certificate
  // =========================================================
  private renderSalaryCertificate(dto: RenderDocumentDto, hash: string, qrDataUrl?: string): string {
    const { employee: emp, company: co } = dto;
    const design = dto.design ?? DesignMode.PRINT_CLEAN;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const body = `
      <div class="header-bar">
        <div>
          <div class="company-name">${co.name}</div>
          <div class="company-meta">${co.address ?? ''}</div>
        </div>
        <div style="text-align:right;font-size:10px;color:#9ca3af;">Date: ${today}</div>
      </div>

      <div class="doc-title">Salary Certificate</div>
      <div class="doc-subtitle">Official Compensation Confirmation</div>

      <div class="body-text">
        <p style="margin-bottom:16px;">This is to certify that <strong>${emp.name}</strong> is a <em>bona fide</em>
        employee of <strong>${co.name}</strong> holding the position of <strong>${emp.designation ?? '—'}</strong>
        in the <strong>${emp.department ?? '—'}</strong> department.</p>
      </div>

      <div class="highlight-box">
        ${emp.gross ? `<div class="field-row"><span class="field-label">Gross Monthly Salary</span><span class="field-value">₹${emp.gross.toLocaleString('en-IN')}</span></div>` : ''}
        ${emp.net ? `<div class="field-row"><span class="field-label">Net Monthly Salary</span><span class="field-value">₹${emp.net.toLocaleString('en-IN')}</span></div>` : ''}
        ${emp.ctc ? `<div class="field-row"><span class="field-label">Annual CTC</span><span class="field-value">₹${emp.ctc.toLocaleString('en-IN')}</span></div>` : ''}
        ${emp.joinDate ? `<div class="field-row"><span class="field-label">Date of Joining</span><span class="field-value">${emp.joinDate}</span></div>` : ''}
      </div>

      <div class="body-text">
        <p>This certificate has been issued upon the request of the employee for official purposes only.</p>
      </div>

      ${this.footerSection(co, hash, qrDataUrl, dto.includeStamp, dto.includeSignature)}
    `;
    return this.pageWrapper('Salary Certificate', body, design);
  }

  // =========================================================
  // 5. Generic Letter Base (Confirmation/Promotion/Transfer etc.)
  // =========================================================
  private renderLetterBase(dto: RenderDocumentDto, hash: string, qrDataUrl?: string): string {
    const { employee: emp, company: co } = dto;
    const design = dto.design ?? DesignMode.PRINT_CLEAN;
    const title = this.titleFromType(dto.type);
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const bodyText = (dto.custom?.['body'] as string) ??
      `This document formally acknowledges relevant information pertaining to <strong>${emp.name}</strong> (${emp.designation ?? ''}).`;

    const body = `
      <div class="header-bar">
        <div>
          <div class="company-name">${co.name}</div>
          <div class="company-meta">${co.address ?? ''}</div>
        </div>
        <div style="text-align:right;font-size:10px;color:#9ca3af;">Date: ${today}</div>
      </div>

      <div class="doc-title">${title}</div>
      <div class="doc-subtitle">${co.name}</div>

      <div class="body-text">
        <p style="margin-bottom:16px;">Dear <strong>${emp.name}</strong>,</p>
        <div style="margin-bottom:16px;">${bodyText}</div>
      </div>

      <div class="highlight-box">
        <div class="field-row"><span class="field-label">Employee</span><span class="field-value">${emp.name}</span></div>
        <div class="field-row"><span class="field-label">Designation</span><span class="field-value">${emp.designation ?? '—'}</span></div>
        <div class="field-row"><span class="field-label">Department</span><span class="field-value">${emp.department ?? '—'}</span></div>
        ${emp.joinDate ? `<div class="field-row"><span class="field-label">Effective Date</span><span class="field-value">${emp.joinDate}</span></div>` : ''}
      </div>

      ${this.footerSection(co, hash, qrDataUrl, dto.includeStamp, dto.includeSignature)}
    `;
    return this.pageWrapper(title, body, design);
  }

  // =========================================================
  // 6. Certificate (Internship, Bonafide)
  // =========================================================
  private renderCertificate(dto: RenderDocumentDto, hash: string, qrDataUrl?: string): string {
    const { employee: emp, company: co } = dto;
    const design = dto.design ?? DesignMode.PRINT_CLEAN;
    const title = this.titleFromType(dto.type);
    const certNumber = `AD-CERT-${Date.now().toString(36).toUpperCase()}`;

    const body = `
      <div style="text-align:center;padding:24px 0 40px;">
        <div class="company-name" style="font-size:18px;">${co.name}</div>
        <div class="company-meta">${co.address ?? ''}</div>
      </div>

      <div style="text-align:center;padding:40px 60px;border:3px solid #7C3AED;border-radius:20px;position:relative;">
        <div style="font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:#7C3AED;margin-bottom:16px;">Certificate of Completion</div>
        <div style="font-family:'Outfit',sans-serif;font-size:38px;font-weight:900;letter-spacing:-2px;margin-bottom:8px;">${title}</div>
        <div style="width:80px;height:3px;background:#7C3AED;margin:0 auto 32px;border-radius:2px;"></div>

        <div style="font-size:13px;color:#6b7280;margin-bottom:12px;">This is to certify that</div>
        <div style="font-family:'Outfit',sans-serif;font-size:30px;font-weight:800;color:#111827;margin-bottom:12px;">${emp.name}</div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:32px;">
          has successfully completed the program as <strong>${emp.designation ?? 'Intern'}</strong>
          in the <strong>${emp.department ?? '—'}</strong> department
          ${emp.joinDate && emp.lastWorkingDay ? `from <strong>${emp.joinDate}</strong> to <strong>${emp.lastWorkingDay}</strong>` : ''}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:48px;">
          <div style="text-align:left;">
            ${co.signatureUrl ? `<img src="${co.signatureUrl}" style="height:48px;margin-bottom:6px;" />` : '<div style="height:48px;border-bottom:1px solid #d1d5db;width:120px;margin-bottom:6px;"></div>'}
            <div style="font-weight:800;font-size:12px;">${co.signatoryName ?? co.name}</div>
            <div style="font-size:10px;color:#9ca3af;">${co.signatoryDesignation ?? 'Authorized Signatory'}</div>
          </div>
          <div style="text-align:right;">
            ${qrDataUrl ? `<img src="${qrDataUrl}" style="width:64px;height:64px;" />` : ''}
            <div style="font-size:9px;font-family:monospace;color:#9ca3af;margin-top:4px;">${certNumber}</div>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin-top:20px;font-size:9px;font-family:monospace;color:#d1d5db;">
        Verification Hash: ${hash}
      </div>
    `;
    return this.pageWrapper(title, body, design);
  }

  // =========================================================
  // 7. ID Card (Returns two cards — front and back)
  // =========================================================
  private renderIdCard(dto: RenderDocumentDto, hash: string, qrDataUrl?: string): string {
    const { employee: emp, company: co } = dto;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ID Card — ${emp.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Outfit:wght@700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f3f4f6; display: flex; gap: 32px; justify-content: center; align-items: flex-start; padding: 48px; flex-wrap: wrap; }
    .card {
      width: 340px; height: 215px;
      border-radius: 18px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .card-front {
      background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 60%, #7c3aed 100%);
      color: #fff;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-back {
      background: #f8f7ff;
      color: #1a1a2e;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid #ede9fe;
    }
    .stripe { position: absolute; top: 0; right: 0; width: 120px; height: 100%; background: rgba(255,255,255,0.04); border-radius: 0 18px 18px 0; }
    .company-tag { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: -0.5px; color: #fff; }
    .tag-line { font-size: 8px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.55); }
    .emp-name { font-family: 'Outfit', sans-serif; font-size: 19px; font-weight: 900; letter-spacing: -0.5px; }
    .emp-role { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.7); margin-top: 2px; }
    .emp-id { font-family: monospace; font-size: 10px; color: rgba(255,255,255,0.6); }
    .photo-placeholder {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 64px; height: 64px;
      border-radius: 12px;
      border: 2px solid rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.1);
      font-size: 22px;
      font-weight: 900;
      color: rgba(255,255,255,0.5);
      font-family: 'Outfit', sans-serif;
    }
    .barcode-line { height: 28px; background: repeating-linear-gradient(90deg, #1a1a2e 0px, #1a1a2e 2px, transparent 2px, transparent 5px); border-radius: 2px; opacity: 0.15; }
  </style>
</head>
<body>
  <!-- FRONT -->
  <div class="card card-front">
    <div class="stripe"></div>
    <div>
      <div class="company-tag">${co.name}</div>
      <div class="tag-line">Identity Card</div>
    </div>
    <div>
      <div class="emp-name">${emp.name}</div>
      <div class="emp-role">${emp.designation ?? 'Employee'}</div>
      <div class="emp-id" style="margin-top:6px;">${emp.employeeId ?? 'EMP-ID'}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;">
      <div style="font-size:8px;color:rgba(255,255,255,0.4);">Valid: ${new Date().getFullYear()}</div>
      <div style="width:32px;height:32px;background:rgba(255,255,255,0.1);border-radius:6px;"></div>
    </div>
    <div class="photo-placeholder">${emp.name.substring(0, 2).toUpperCase()}</div>
  </div>

  <!-- BACK -->
  <div class="card card-back">
    <div>
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7C3AED;">Verification</div>
      ${qrDataUrl ? `<img src="${qrDataUrl}" style="width:56px;height:56px;margin-top:4px;" />` : '<div style="width:56px;height:56px;background:#ede9fe;border-radius:8px;margin-top:4px;"></div>'}
    </div>
    <div>
      <div style="font-size:9px;color:#6b7280;margin-bottom:4px;">${emp.email ?? ''}</div>
      <div style="font-size:9px;color:#6b7280;">${emp.phone ?? ''}</div>
    </div>
    <div>
      <div class="barcode-line"></div>
      <div style="font-family:monospace;font-size:8px;color:#d1d5db;text-align:center;margin-top:4px;">${hash.substring(0, 24).toUpperCase()}</div>
    </div>
    <div style="font-size:8px;color:#9ca3af;">If found, please contact ${co.email ?? co.name}</div>
  </div>
</body>
</html>`;
  }

  // =========================================================
  // 8. Visiting Card
  // =========================================================
  private renderVisitingCard(dto: RenderDocumentDto, hash: string, qrDataUrl?: string): string {
    const { employee: emp, company: co } = dto;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Visiting Card — ${emp.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Outfit:wght@700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f3f4f6; display: flex; gap: 24px; justify-content: center; align-items: center; padding: 48px; flex-wrap: wrap; min-height: 100vh; }
    .bcard {
      width: 350px; height: 200px;
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      print-color-adjust: exact;
    }
    .bcard-front {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #fff;
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    .bcard-back {
      background: #fff;
      border: 2px solid #ede9fe;
      color: #1a1a2e;
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    .sheen {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%);
      pointer-events: none;
    }
    .ornament {
      position: absolute;
      bottom: -20px;
      right: -20px;
      width: 120px;
      height: 120px;
      background: rgba(124,58,237,0.15);
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <!-- FRONT -->
  <div class="bcard">
    <div class="bcard-front">
      <div class="sheen"></div>
      <div class="ornament"></div>
      <div>
        <div style="font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.5);">${co.name}</div>
      </div>
      <div>
        <div style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.5px;">${emp.name}</div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#a78bfa;margin-top:3px;">${emp.designation ?? ''}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="font-size:9px;color:rgba(255,255,255,0.4);">${emp.email ?? ''}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.4);">${emp.phone ?? ''}</div>
      </div>
    </div>
  </div>

  <!-- BACK -->
  <div class="bcard">
    <div class="bcard-back">
      <div style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:900;color:#7C3AED;">${co.name}</div>
      <div>
        ${co.address ? `<div style="font-size:9px;color:#9ca3af;margin-bottom:4px;">${co.address}</div>` : ''}
        ${co.website ? `<div style="font-size:9px;font-weight:600;color:#7C3AED;">${co.website}</div>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="font-size:9px;color:#9ca3af;">Scan to connect</div>
        ${qrDataUrl ? `<img src="${qrDataUrl}" style="width:52px;height:52px;" />` : '<div style="width:52px;height:52px;background:#f5f3ff;border-radius:6px;"></div>'}
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // =========================================================
  // Shared Footer Section
  // =========================================================
  private footerSection(
    co: RenderDocumentDto['company'],
    hash: string,
    qrDataUrl?: string,
    includeStamp?: boolean,
    includeSignature?: boolean,
  ): string {
    return `
      <div class="footer-section">
        <div class="signature-block">
          ${includeSignature && co.signatureUrl ? `<img src="${co.signatureUrl}" style="height:44px;margin-bottom:6px;" />` : (includeSignature !== false ? '<div style="height:44px;border-bottom:1px solid #d1d5db;width:120px;margin-bottom:6px;"></div>' : '')}
          ${includeStamp && co.stampUrl ? `<img src="${co.stampUrl}" style="width:60px;height:60px;opacity:0.7;position:absolute;right:200px;bottom:80px;" />` : ''}
          <div class="signature-name">${co.signatoryName ?? co.name}</div>
          <div class="signature-role">${co.signatoryDesignation ?? 'Authorized Signatory'}</div>
          <div style="font-size:9px;color:#d1d5db;margin-top:8px;font-family:monospace;">Hash: ${hash}</div>
        </div>
        <div class="qr-block">
          ${qrDataUrl ? `<img src="${qrDataUrl}" alt="Verification QR" />` : '<div style="width:72px;height:72px;background:#f5f3ff;border-radius:8px;"></div>'}
          <div class="verify-hash">Verify: ${hash.substring(0, 16).toUpperCase()}</div>
        </div>
      </div>
    `;
  }

  // =========================================================
  // Utility: Title from DocumentType
  // =========================================================
  private titleFromType(type: DocumentType): string {
    const map: Partial<Record<DocumentType, string>> = {
      [DocumentType.OFFER_LETTER]:           'Offer Letter',
      [DocumentType.APPOINTMENT_LETTER]:     'Appointment Letter',
      [DocumentType.EXPERIENCE_LETTER]:      'Experience Letter',
      [DocumentType.RELIEVING_LETTER]:       'Relieving Letter',
      [DocumentType.SALARY_SLIP]:            'Salary Slip',
      [DocumentType.SALARY_CERTIFICATE]:     'Salary Certificate',
      [DocumentType.CONFIRMATION_LETTER]:    'Confirmation Letter',
      [DocumentType.PROMOTION_LETTER]:       'Promotion Letter',
      [DocumentType.INCREMENT_LETTER]:       'Increment Letter',
      [DocumentType.TRANSFER_LETTER]:        'Transfer Letter',
      [DocumentType.INTERNSHIP_OFFER]:       'Internship Offer Letter',
      [DocumentType.INTERNSHIP_CERTIFICATE]: 'Internship Completion Certificate',
      [DocumentType.INTERNSHIP_EXPERIENCE]:  'Internship Experience Letter',
      [DocumentType.BONAFIDE_CERTIFICATE]:   'Bonafide Certificate',
      [DocumentType.WARNING_LETTER]:         'Warning Letter',
      [DocumentType.TERMINATION_LETTER]:     'Termination Letter',
      [DocumentType.ID_CARD]:                'Employee ID Card',
      [DocumentType.VISITING_CARD]:          'Visiting Card',
    };
    return map[type] ?? 'Document';
  }
}
