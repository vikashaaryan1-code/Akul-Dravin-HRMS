import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';

interface TotpSecret {
  id: string;
  userId: string;
  secretEnc: string;
  isEnabled: boolean;
  backupCodes: string[];
  verifiedAt: Date | null;
}

/**
 * TotpService — RFC 6238 Time-based OTP (Google Authenticator compatible)
 *
 * Secrets are AES-256-GCM encrypted before storage.
 * In production: TOTP_ENCRYPTION_KEY env var must be a 32-byte hex string.
 *
 * Note: This uses a lightweight TOTP implementation without adding new packages.
 * In production, replace with 'otplib' npm package for full RFC 6238 compliance.
 */
@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);
  private readonly encKey: Buffer;

  constructor() {
    const keyHex = process.env.TOTP_ENCRYPTION_KEY;
    if (!keyHex || keyHex.length < 64) {
      this.logger.warn('TOTP_ENCRYPTION_KEY not set or < 32 bytes — 2FA encryption degraded. Set TOTP_ENCRYPTION_KEY=<64-char-hex>');
      // Use a deterministic fallback (NOT secure for production)
      this.encKey = Buffer.alloc(32, 0);
    } else {
      this.encKey = Buffer.from(keyHex.slice(0, 64), 'hex');
    }
  }

  // ── Encryption ──────────────────────────────────────────────────────────

  private encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGO, this.encKey, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
  }

  private decrypt(ciphertext: string): string {
    const [ivHex, tagHex, dataHex] = ciphertext.split(':');
    if (!ivHex || !tagHex || !dataHex) throw new Error('Invalid ciphertext format');
    const iv  = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const dec = createDecipheriv(ALGO, this.encKey, iv);
    dec.setAuthTag(tag);
    return dec.update(Buffer.from(dataHex, 'hex')).toString('utf8') + dec.final('utf8');
  }

  // ── TOTP helpers (lightweight RFC 6238 implementation) ──────────────────

  private generateBase32Secret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    return Array.from(randomBytes(20)).map(b => chars[b % 32]).join('');
  }

  private hotp(secret: string, counter: number): number {
    // RFC 4226 — simplified implementation
    const key = Buffer.from(this.base32Decode(secret));
    const counterBuf = Buffer.allocUnsafe(8);
    counterBuf.writeBigInt64BE(BigInt(counter));
    const { createHmac } = require('crypto');
    const hmac = createHmac('sha1', key).update(counterBuf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                  (hmac[offset + 3] & 0xff);
    return code % 1_000_000;
  }

  private base32Decode(input: string): Uint8Array {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = input.toUpperCase().replace(/=+$/, '');
    let bits = 0, value = 0;
    const output: number[] = [];
    for (const char of cleaned) {
      value = (value << 5) | CHARS.indexOf(char);
      bits += 5;
      if (bits >= 8) { output.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
    }
    return new Uint8Array(output);
  }

  verifyTotp(secret: string, code: string): boolean {
    const counter = Math.floor(Date.now() / 1000 / 30);
    const target = parseInt(code, 10);
    // Allow 1 window drift (±30 sec)
    for (const drift of [-1, 0, 1]) {
      if (this.hotp(secret, counter + drift) === target) return true;
    }
    return false;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  generateSetupPayload(userId: string, email: string): { secret: string; qrUri: string; encryptedSecret: string } {
    const secret = this.generateBase32Secret();
    const qrUri = `otpauth://totp/Akul%20Dravin%20HRMS:${encodeURIComponent(email)}?secret=${secret}&issuer=AkulDravin`;
    return { secret, qrUri, encryptedSecret: this.encrypt(secret) };
  }

  verifyCode(encryptedSecret: string, code: string): boolean {
    try {
      const secret = this.decrypt(encryptedSecret);
      return this.verifyTotp(secret, code);
    } catch {
      return false;
    }
  }

  generateBackupCodes(count = 8): string[] {
    return Array.from({ length: count }, () => randomBytes(4).toString('hex').toUpperCase());
  }
}
