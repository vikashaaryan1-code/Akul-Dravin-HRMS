import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { StripeWebhookService } from './stripe-webhook.service';

/**
 * POST /billing/stripe/webhook
 *
 * Receives Stripe events and dispatches them to StripeWebhookService.
 *
 * Critical requirements:
 *  1. Must receive the RAW body — Stripe signature verification fails on parsed JSON.
 *     main.ts must enable `rawBody: true` on the NestJS app.
 *  2. No JWT auth guard — Stripe cannot send auth tokens. Security = signature verification.
 *  3. Throttled at the 'webhook' tier (100 req/60s) — Stripe typically sends < 10/min.
 *  4. Always returns 200 immediately — Stripe considers 2xx a success and stops retrying.
 *     On 4xx/5xx Stripe retries for up to 3 days.
 */
@Controller('billing/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly webhookService: StripeWebhookService) {}

  @Post('webhook')
  @HttpCode(200)
  @Throttle({ webhook: { ttl: 60000, limit: 100 } })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException(
        'Empty request body — ensure rawBody: true is set in main.ts',
      );
    }

    try {
      await this.webhookService.processEvent(rawBody, signature);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`STRIPE_WEBHOOK_FAILED sig=${signature.slice(0, 20)}… err=${msg}`);
      // Rethrow so Stripe sees a non-200 and retries (up to 3 days)
      throw err;
    }

    return { received: true };
  }
}
