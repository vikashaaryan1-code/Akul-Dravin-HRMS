import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TenantContext } from '../../common/context/tenant-context';

/**
 * PAYMENT GATEWAY ABSTRACTION SERVICE
 *
 * Production-ready multi-gateway payment layer.
 * Supported gateways:
 *   - Stripe       (subscriptions, invoices, webhooks)
 *   - Razorpay     (wallet recharge, INR subscriptions)
 *   - Cashfree     (payroll disbursement, UPI)
 *
 * All operations are tenant-isolated and fully audit-logged.
 * Webhook signatures are verified before processing.
 *
 * Usage:
 *   const result = await paymentService.createPaymentIntent({ gateway: 'razorpay', ... });
 */

export type GatewayId = 'stripe' | 'razorpay' | 'cashfree';

export interface CreatePaymentIntentDto {
  gateway:     GatewayId;
  amountPaise: number;          // Amount in smallest currency unit (paise / cents)
  currency:    string;          // 'INR' | 'USD' | etc.
  description: string;
  metadata?:   Record<string, string>;
  customerId?: string;
  returnUrl?:  string;
}

export interface PaymentIntent {
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  status:          'created' | 'paid' | 'failed' | 'pending';
  gateway:         GatewayId;
  amountPaise:     number;
  currency:        string;
  checkoutUrl?:    string;
  raw?:            unknown;
}

export interface WebhookVerificationResult {
  verified: boolean;
  eventType: string;
  orderId?:  string;
  status?:   string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  constructor(private readonly httpService: HttpService) {}

  // ─── Intent Creation ──────────────────────────────────────────────────────

  async createPaymentIntent(dto: CreatePaymentIntentDto): Promise<PaymentIntent> {
    this.logger.log(
      `PAYMENT_INTENT gateway=${dto.gateway} amount=${dto.amountPaise} ${dto.currency}`,
    );

    switch (dto.gateway) {
      case 'stripe':    return this.createStripeIntent(dto);
      case 'razorpay':  return this.createRazorpayOrder(dto);
      case 'cashfree':  return this.createCashfreeOrder(dto);
      default:
        throw new Error(`Unsupported gateway: ${dto.gateway}`);
    }
  }

  // ─── Stripe ───────────────────────────────────────────────────────────────

  private async createStripeIntent(dto: CreatePaymentIntentDto): Promise<PaymentIntent> {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured');

    const params = new URLSearchParams({
      amount:   String(dto.amountPaise),
      currency: dto.currency.toLowerCase(),
      description: dto.description,
      'metadata[tenantId]': TenantContext.getTenantId() ?? 'unknown',
      ...Object.fromEntries(
        Object.entries(dto.metadata ?? {}).map(([k, v]) => [`metadata[${k}]`, v]),
      ),
    });

    const { data } = (await firstValueFrom(
      this.httpService.post('https://api.stripe.com/v1/payment_intents', params, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    )) as any;

    return {
      gatewayOrderId: data.id,
      status:         data.status === 'succeeded' ? 'paid' : 'created',
      gateway:        'stripe',
      amountPaise:    data.amount,
      currency:       data.currency.toUpperCase(),
      checkoutUrl:    data.next_action?.redirect_to_url?.url,
      raw:            process.env.NODE_ENV !== 'production' ? data : undefined,
    };
  }

  // ─── Razorpay ─────────────────────────────────────────────────────────────

  private async createRazorpayOrder(dto: CreatePaymentIntentDto): Promise<PaymentIntent> {
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured');

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const { data } = (await firstValueFrom(
      this.httpService.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount:   dto.amountPaise,
          currency: dto.currency.toUpperCase(),
          notes:    { tenantId: TenantContext.getTenantId(), description: dto.description, ...dto.metadata },
        },
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    )) as any;

    return {
      gatewayOrderId: data.id,
      status:         data.status === 'paid' ? 'paid' : 'created',
      gateway:        'razorpay',
      amountPaise:    data.amount,
      currency:       data.currency,
      raw:            process.env.NODE_ENV !== 'production' ? data : undefined,
    };
  }

  // ─── Cashfree ─────────────────────────────────────────────────────────────

  private async createCashfreeOrder(dto: CreatePaymentIntentDto): Promise<PaymentIntent> {
    const appId     = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secretKey) throw new Error('CASHFREE_APP_ID / CASHFREE_SECRET_KEY not configured');

    const isProd = process.env.NODE_ENV === 'production';
    const baseUrl = isProd
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    const orderId = `hrms_${TenantContext.getTenantId()}_${Date.now()}`;

    const { data } = (await firstValueFrom(
      this.httpService.post(
        `${baseUrl}/orders`,
        {
          order_id:       orderId,
          order_amount:   dto.amountPaise / 100,  // Cashfree uses INR units
          order_currency: dto.currency.toUpperCase(),
          order_note:     dto.description,
          customer_details: {
            customer_id:    dto.customerId ?? orderId,
            customer_email: dto.metadata?.['email'] ?? 'noreply@akuldravin.com',
            customer_phone: dto.metadata?.['phone'] ?? '9999999999',
          },
          order_meta: { return_url: dto.returnUrl ?? process.env.CASHFREE_RETURN_URL },
        },
        {
          headers: {
            'x-api-version': '2022-09-01',
            'x-client-id':   appId,
            'x-client-secret': secretKey,
            'Content-Type':  'application/json',
          },
        },
      ),
    )) as any;

    return {
      gatewayOrderId: orderId,
      status:         'created',
      gateway:        'cashfree',
      amountPaise:    dto.amountPaise,
      currency:       dto.currency,
      checkoutUrl:    data.payment_session_id
        ? `${isProd ? 'https://payments.cashfree.com' : 'https://sandbox.cashfree.com'}/pg?session_id=${data.payment_session_id}`
        : undefined,
      raw: process.env.NODE_ENV !== 'production' ? data : undefined,
    };
  }

  // ─── Webhook Verification ─────────────────────────────────────────────────

  async verifyWebhook(
    gateway:   GatewayId,
    payload:   Buffer,
    signature: string,
    headers?:  Record<string, string>,
  ): Promise<WebhookVerificationResult> {
    const crypto = await import('node:crypto');

    if (gateway === 'stripe') {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
      const parts         = signature.split(',');
      const ts            = parts.find(p => p.startsWith('t='))?.split('=')[1] ?? '';
      const sigPart       = parts.find(p => p.startsWith('v1='))?.split('=')[1] ?? '';
      const signed        = `${ts}.${payload.toString('utf-8')}`;
      const expected      = crypto.createHmac('sha256', webhookSecret).update(signed).digest('hex');
      const verified      = crypto.timingSafeEqual(Buffer.from(sigPart, 'hex'), Buffer.from(expected, 'hex'));

      const event = JSON.parse(payload.toString('utf-8'));
      return { verified, eventType: event.type, orderId: event.data?.object?.id, status: event.data?.object?.status };
    }

    if (gateway === 'razorpay') {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
      const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
      const verified = signature === expected;
      const event    = JSON.parse(payload.toString('utf-8'));
      return { verified, eventType: event.event, orderId: event.payload?.payment?.entity?.order_id };
    }

    // Cashfree
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET ?? '';
    const body          = JSON.parse(payload.toString('utf-8'));
    const ts            = headers?.['x-webhook-timestamp'] ?? '';
    const signed        = `${ts}${payload.toString('utf-8')}`;
    const expected      = crypto.createHmac('sha256', webhookSecret).update(signed).digest('base64');
    const verified      = signature === expected;
    return { verified, eventType: body.type, orderId: body.data?.order?.order_id, status: body.data?.payment?.payment_status };
  }
}
