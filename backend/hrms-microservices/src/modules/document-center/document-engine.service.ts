import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { TemplateEngineService } from './template-engine.service';
import { DocumentType, DesignMode } from './dto/render-document.dto';
import type { RenderDocumentDto } from './dto/render-document.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface DocumentRenderResult {
  /** Verification hash (SHA-256 of payload) */
  hash: string;
  /** Serialised HTML string ready for headless browser rendering */
  html: string;
  /** Base64-encoded PDF bytes (if PDF conversion is available) */
  pdfBase64?: string;
  /** Printable filename suggestion */
  filename: string;
  /** Metadata for audit recording */
  meta: {
    type: DocumentType;
    design: DesignMode;
    employeeName: string;
    companyName: string;
    generatedAt: string;
  };
}

/**
 * OMNIX Document Engine v1
 *
 * Orchestrates:
 *  1. Payload hashing (SHA-256 integrity guarantee)
 *  2. QR verification URL generation (stub — replace with real qrcode library)
 *  3. Template rendering via TemplateEngineService
 *  4. Optional: HTML → PDF via Playwright (if installed)
 */
@Injectable()
export class DocumentEngineService {
  private readonly logger = new Logger(DocumentEngineService.name);

  constructor(private readonly templateEngine: TemplateEngineService) {}

  /**
   * Primary render entrypoint.
   * Returns HTML + metadata; PDF is generated if Playwright is available.
   */
  async render(dto: RenderDocumentDto): Promise<DocumentRenderResult> {
    const design = dto.design ?? DesignMode.PRINT_CLEAN;

    // Step 1: Generate cryptographic hash of the document payload
    const hash = this.generateHash(dto);

    // Step 2: Generate QR code data URL (base64 PNG of verification URL)
    const verifyUrl = `https://omnix.akuldravin.com/verify/${hash.substring(0, 16)}`;
    const qrDataUrl = await this.generateQr(verifyUrl);

    // Step 3: Render HTML from template engine
    const html = this.templateEngine.render(dto, hash, qrDataUrl);

    // Step 4: Attempt PDF conversion (non-blocking — degrades gracefully)
    let pdfBase64: string | undefined;
    if (dto.design !== DesignMode.GLASS_3D) {
      pdfBase64 = await this.htmlToPdfBase64(html, dto.type).catch((err) => {
        this.logger.warn(`PDF conversion unavailable: ${err.message}. Returning HTML only.`);
        return undefined;
      });
    }

    const filename = this.buildFilename(dto);

    const result: DocumentRenderResult = {
      hash,
      html,
      pdfBase64,
      filename,
      meta: {
        type: dto.type,
        design,
        employeeName: dto.employee.name,
        companyName: dto.company.name,
        generatedAt: new Date().toISOString(),
      },
    };

    this.logger.log(
      `Document rendered type=${dto.type} design=${design} employee="${dto.employee.name}" hash=${hash.substring(0, 12)}`,
    );

    return result;
  }

  // =========================================================
  // Integrity Hashing
  // =========================================================
  private generateHash(dto: RenderDocumentDto): string {
    const payload = JSON.stringify({
      type: dto.type,
      employee: dto.employee,
      company: {
        name: dto.company.name,
        cin: dto.company.cin,
        gstin: dto.company.gstin,
      },
      custom: dto.custom,
      issuedAt: new Date().toISOString().slice(0, 10), // date-stable
    });
    return createHash('sha256').update(payload).digest('hex');
  }

  // =========================================================
  // QR Code Generation (inline SVG fallback, no external deps)
  // =========================================================
  private async generateQr(url: string): Promise<string | undefined> {
    // Try to use qrcode library if available (optional peer dep)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const QRCode = require('qrcode') as { toDataURL: (s: string) => Promise<string> };
      const dataUrl = await QRCode.toDataURL(url);
      return dataUrl;
    } catch {
      // Return a simple SVG placeholder as base64 data URL
      const svgQr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect width="100" height="100" fill="white"/>
        <rect x="10" y="10" width="30" height="30" fill="none" stroke="#7C3AED" stroke-width="4"/>
        <rect x="20" y="20" width="10" height="10" fill="#7C3AED"/>
        <rect x="60" y="10" width="30" height="30" fill="none" stroke="#7C3AED" stroke-width="4"/>
        <rect x="70" y="20" width="10" height="10" fill="#7C3AED"/>
        <rect x="10" y="60" width="30" height="30" fill="none" stroke="#7C3AED" stroke-width="4"/>
        <rect x="20" y="70" width="10" height="10" fill="#7C3AED"/>
        <rect x="50" y="50" width="10" height="10" fill="#7C3AED"/>
        <rect x="65" y="55" width="10" height="10" fill="#7C3AED"/>
        <rect x="80" y="65" width="10" height="10" fill="#7C3AED"/>
        <rect x="55" y="75" width="10" height="10" fill="#7C3AED"/>
        <rect x="70" y="80" width="10" height="10" fill="#7C3AED"/>
      </svg>`;
      const b64 = Buffer.from(svgQr).toString('base64');
      return `data:image/svg+xml;base64,${b64}`;
    }
  }

  // =========================================================
  // HTML → PDF via Playwright (optional)
  // =========================================================
  private async htmlToPdfBase64(html: string, type: DocumentType): Promise<string> {
    // Write HTML to temp file and convert via Playwright
    // This will throw if Playwright is not installed — caller handles gracefully
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // Playwright is an optional runtime dependency — installed separately in production.
    // Using a plain require so TS does not try to resolve its type declarations at compile time.
    const playwrightModule = require('playwright') as { chromium: { launch: (opts: any) => Promise<any> } };
    const { chromium } = playwrightModule;


    const isCard = type === DocumentType.ID_CARD || type === DocumentType.VISITING_CARD;
    const tmpPath = path.join(os.tmpdir(), `omnix-doc-${Date.now()}.html`);
    fs.writeFileSync(tmpPath, html, 'utf-8');

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`file://${tmpPath}`, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: isCard ? undefined : 'A4',
      width: isCard ? '400px' : undefined,
      height: isCard ? '300px' : undefined,
      printBackground: true,
      margin: isCard ? { top: '0', bottom: '0', left: '0', right: '0' } : undefined,
    });

    await browser.close();
    fs.unlinkSync(tmpPath);

    return Buffer.from(pdfBuffer).toString('base64');
  }

  // =========================================================
  // Filename builder
  // =========================================================
  private buildFilename(dto: RenderDocumentDto): string {
    const safeName = dto.employee.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const typeSlug = dto.type.replace(/_/g, '-');
    const date = new Date().toISOString().slice(0, 10);
    return `omnix-${typeSlug}-${safeName}-${date}.pdf`;
  }
}
