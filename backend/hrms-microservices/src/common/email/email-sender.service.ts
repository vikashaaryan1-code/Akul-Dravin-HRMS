import { Injectable, Logger } from '@nestjs/common';
import * as https from 'node:https';
import * as crypto from 'node:crypto';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * EmailSenderService
 *
 * Sends transactional email via AWS SES SMTP endpoint using AWS Signature V4.
 * Zero new npm dependencies — uses Node.js built-in https + crypto.
 *
 * Required environment variables:
 *   AWS_SES_REGION     — e.g. ap-south-1
 *   AWS_SES_FROM_EMAIL — verified sender address, e.g. no-reply@yourdomain.com
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *
 * If env vars are missing → logs WARN and skips send (safe for local dev).
 */
@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  private get region(): string { return process.env.AWS_SES_REGION ?? ''; }
  private get from(): string { return process.env.AWS_SES_FROM_EMAIL ?? ''; }
  private get keyId(): string { return process.env.AWS_ACCESS_KEY_ID ?? ''; }
  private get secret(): string { return process.env.AWS_SECRET_ACCESS_KEY ?? ''; }

  private get isConfigured(): boolean {
    return !!(this.region && this.from && this.keyId && this.secret);
  }

  async send(opts: SendEmailOptions): Promise<{ messageId?: string; skipped?: boolean }> {
    const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];

    if (!this.isConfigured) {
      this.logger.warn(
        `EMAIL_SENDER_NOT_CONFIGURED: AWS SES env vars missing. ` +
        `Would send to=${recipients.join(',')} subject="${opts.subject}". ` +
        'Set AWS_SES_REGION, AWS_SES_FROM_EMAIL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.',
      );
      return { skipped: true };
    }

    // Build SES SendEmail request body (AWS v2 format — query string)
    const params = new URLSearchParams();
    params.set('Action', 'SendEmail');
    params.set('Source', this.from);
    params.set('Message.Subject.Data', opts.subject);
    params.set('Message.Subject.Charset', 'UTF-8');
    params.set('Message.Body.Html.Data', opts.htmlBody);
    params.set('Message.Body.Html.Charset', 'UTF-8');
    if (opts.textBody) {
      params.set('Message.Body.Text.Data', opts.textBody);
      params.set('Message.Body.Text.Charset', 'UTF-8');
    }
    recipients.forEach((addr, i) => {
      params.set(`Destination.ToAddresses.member.${i + 1}`, addr);
    });
    params.set('Version', '2010-12-01');

    const body = params.toString();
    const host = `email.${this.region}.amazonaws.com`;
    const path = '/';
    const messageId = await this.sigV4Post(host, path, body);

    this.logger.log(
      `EMAIL_SENT to=${recipients.join(',')} subject="${opts.subject}" messageId=${messageId}`,
    );
    return { messageId };
  }

  // ─── AWS Signature Version 4 ─────────────────────────────────────────────

  private async sigV4Post(host: string, path: string, body: string): Promise<string> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);
    const service = 'ses';
    const region = this.region;

    const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
    const canonicalHeaders = `content-type:application/x-www-form-urlencoded\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-date';
    const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n` +
      crypto.createHash('sha256').update(canonicalRequest).digest('hex');

    const signingKey = this.hmac(
      this.hmac(
        this.hmac(
          this.hmac(`AWS4${this.secret}`, dateStamp),
          region,
        ),
        service,
      ),
      'aws4_request',
    );
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    const authHeader =
      `AWS4-HMAC-SHA256 Credential=${this.keyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: host,
          method: 'POST',
          path,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
            'x-amz-date': amzDate,
            Authorization: authHeader,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const match = data.match(/<MessageId>([^<]+)<\/MessageId>/);
              resolve(match?.[1] ?? 'unknown');
            } else {
              reject(new Error(`SES HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private hmac(key: string | Buffer, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
  }
}
