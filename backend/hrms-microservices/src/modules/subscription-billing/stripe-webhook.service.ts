import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { DataSource } from 'typeorm';
import { PaymentEventEntity } from '../../database/entities/payment-event.entity';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { InvoiceEntity } from '../../database/entities/invoice.entity';

/**
 * StripeWebhookService
 *
 * Handles Stripe webhook event processing without the Stripe SDK dependency.
 * Signature verification uses the same HMAC-SHA256 algorithm as the SDK.
 *
 * Supported events:
 *   checkout.session.completed  → activate / create subscription
 *   invoice.paid                → mark subscription active, create invoice record
 *   customer.subscription.deleted → deactivate subscription
 *
 * Idempotency: UNIQUE constraint on payment_events.stripe_event_id.
 * Duplicate events (Stripe retries) are silently acknowledged.
 */
@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(private readonly dataSource: DataSource) {}

  // ── Signature verification ─────────────────────────────────────────────────

  /**
   * Verifies Stripe webhook signature using HMAC-SHA256.
   * Equivalent to stripe.webhooks.constructEvent() without the SDK.
   *
   * @param rawBody   - Raw request body buffer
   * @param signature - Value of stripe-signature header
   * @param secret    - STRIPE_WEBHOOK_SECRET env variable
   * @param tolerance - Maximum timestamp drift in seconds (default: 300 = 5 min)
   */
  private verifySignature(
    rawBody: Buffer,
    signature: string,
    secret: string,
    tolerance = 300,
  ): Record<string, unknown> {
    // Parse t=<timestamp>,v1=<sig1>,v1=<sig2>,...
    const parts = Object.fromEntries(
      signature.split(',').map((chunk) => chunk.split('=')),
    );

    const timestamp = parts['t'];
    const v1Sig     = parts['v1'];

    if (!timestamp || !v1Sig) {
      throw new UnauthorizedException('Malformed stripe-signature header');
    }

    // Replay attack protection — reject events older than tolerance window
    const now  = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - parseInt(timestamp, 10));
    if (diff > tolerance) {
      throw new UnauthorizedException(
        `Stripe webhook timestamp too old (${diff}s > ${tolerance}s tolerance)`,
      );
    }

    // Compute expected HMAC
    const payload  = `${timestamp}.${rawBody.toString('utf8')}`;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');

    // Timing-safe comparison (prevents timing oracle attacks)
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(v1Sig,    'hex');

    if (
      expectedBuf.length !== receivedBuf.length ||
      !timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      throw new UnauthorizedException('Stripe webhook signature mismatch');
    }

    return JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
  }

  // ── Main dispatch ──────────────────────────────────────────────────────────

  async processEvent(rawBody: Buffer, signature: string): Promise<void> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new Error('Webhook secret not configured');
    }

    // Verify and parse
    const event    = this.verifySignature(rawBody, signature, secret);
    const eventId  = event['id'] as string;
    const type     = event['type'] as string;
    const data     = event['data'] as Record<string, unknown>;
    const obj      = data?.['object'] as Record<string, unknown>;

    this.logger.log(`STRIPE_EVENT type=${type} id=${eventId}`);

    // Idempotency — check for duplicate before processing
    const repo = this.dataSource.getRepository(PaymentEventEntity);
    const existing = await repo.findOne({ where: { stripeEventId: eventId } });
    if (existing) {
      this.logger.debug(`STRIPE_EVENT_DUPLICATE id=${eventId} — skipping`);
      return; // Already processed, return 200 to Stripe
    }

    // Route to handler
    switch (type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(obj, event);
        break;
      case 'invoice.paid':
      case 'invoice.payment_succeeded':   // alias used in older API versions
        await this.handleInvoicePaid(obj, event);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(obj, event);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(obj, event);
        break;
      default:
        this.logger.debug(`STRIPE_EVENT_UNHANDLED type=${type} — acknowledged`);
    }

    // Record event for idempotency + audit trail
    await repo.save(repo.create({
      stripeEventId:    eventId,
      eventType:        type,
      stripeCustomerId: (obj?.['customer'] as string) ?? null,
      rawPayload:       event,
      status:           'processed',
    }));
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  /**
   * checkout.session.completed
   * Fired when a customer completes the Stripe Checkout payment flow.
   * Creates or activates a SubscriptionEntity for the company.
   */
  private async handleCheckoutCompleted(
    session: Record<string, unknown>,
    event:   Record<string, unknown>,
  ): Promise<void> {
    const companyId  = (session?.['client_reference_id'] as string) ?? null;
    const customerId = session?.['customer'] as string;
    const planName   = (session?.['metadata'] as Record<string, string>)?.['plan'] ?? 'Pro';

    if (!companyId) {
      this.logger.warn(`checkout.session.completed missing client_reference_id — cannot link subscription`);
      return;
    }

    const subRepo = this.dataSource.getRepository(SubscriptionEntity);
    const now     = new Date();

    // Upsert: if company already has a sub, reactivate; otherwise create
    let sub = await subRepo.findOne({ where: { companyId, status: 'inactive' } });

    if (sub) {
      sub.status    = 'active';
      sub.startDate = now.toISOString().slice(0, 10);
      sub.updatedAt = now;
    } else {
      sub = subRepo.create({
        companyId,
        planName,
        billingCycle: (session?.['metadata'] as Record<string, string>)?.['cycle'] ?? 'monthly',
        price:        String(((session?.['amount_total'] as number) ?? 0) / 100),
        features:     { stripeCustomerId: customerId },
        startDate:    now.toISOString().slice(0, 10),
        status:       'active',
      });
    }

    await subRepo.save(sub);
    this.logger.log(`SUBSCRIPTION_ACTIVATED companyId=${companyId} plan=${planName}`);
  }

  /**
   * invoice.paid
   * Fired when Stripe successfully charges for a subscription renewal.
   * Creates an InvoiceEntity record and keeps subscription active.
   */
  private async handleInvoicePaid(
    invoice: Record<string, unknown>,
    event:   Record<string, unknown>,
  ): Promise<void> {
    const customerId = invoice?.['customer'] as string;
    const amount     = invoice?.['amount_paid'] as number ?? 0;
    const currency   = (invoice?.['currency'] as string)?.toUpperCase() ?? 'INR';
    const number     = invoice?.['number'] as string ?? `STRIPE-${Date.now()}`;

    const subRepo = this.dataSource.getRepository(SubscriptionEntity);
    const invRepo = this.dataSource.getRepository(InvoiceEntity);

    // Find subscription by stripeCustomerId stored in features JSON
    const sub = await subRepo
      .createQueryBuilder('sub')
      .where(`sub.features->>'stripeCustomerId' = :cid`, { cid: customerId })
      .getOne();

    const subId = sub?.id ?? null;
    if (!sub) {
      this.logger.warn(`invoice.paid: no subscription found for customer ${customerId}`);
    }

    const inv = invRepo.create({
      subscriptionId: subId,
      invoiceNumber:  number,
      amount:         String(amount / 100),
      currency,
      dueDate:        new Date().toISOString().slice(0, 10),
      status:         'paid',
    });

    await invRepo.save(inv);
    this.logger.log(`INVOICE_CREATED invoiceNumber=${number} amount=${amount / 100} ${currency}`);
  }

  /**
   * invoice.payment_failed
   * Fired when Stripe cannot charge for a renewal (card declined, expired, etc.).
   * Marks the subscription as 'past_due' — access is restricted after grace period.
   * Stripe will automatically retry the charge (typically 3×).
   */
  private async handleInvoicePaymentFailed(
    invoice: Record<string, unknown>,
    event:   Record<string, unknown>,
  ): Promise<void> {
    const customerId = invoice?.['customer'] as string;
    const amount     = invoice?.['amount_due'] as number ?? 0;
    const currency   = (invoice?.['currency'] as string)?.toUpperCase() ?? 'INR';
    const number     = invoice?.['number'] as string ?? `STRIPE-FAIL-${Date.now()}`;
    const attemptCount = invoice?.['attempt_count'] as number ?? 1;

    const subRepo = this.dataSource.getRepository(SubscriptionEntity);

    const sub = await subRepo
      .createQueryBuilder('sub')
      .where(`sub.features->>'stripeCustomerId' = :cid`, { cid: customerId })
      .getOne();

    if (sub) {
      sub.status    = 'past_due';
      sub.updatedAt = new Date();
      await subRepo.save(sub);
      this.logger.warn(
        `SUBSCRIPTION_PAST_DUE subId=${sub.id} companyId=${sub.companyId} ` +
        `attempt=${attemptCount}`,
      );
    } else {
      this.logger.warn(`invoice.payment_failed: no subscription found for customer ${customerId}`);
    }

    // Record failed payment event for audit trail
    const invRepo = this.dataSource.getRepository(InvoiceEntity);
    const inv = invRepo.create({
      subscriptionId: sub?.id ?? null,
      invoiceNumber:  number,
      amount:         String(amount / 100),
      currency,
      dueDate:        new Date().toISOString().slice(0, 10),
      status:         'failed',
    });
    await invRepo.save(inv);
    this.logger.log(`INVOICE_PAYMENT_FAILED invoiceNumber=${number} attempt=${attemptCount}`);
  }

  /**
   * customer.subscription.deleted
   * Fired when a subscription is cancelled or lapses.
   * Marks the SubscriptionEntity as inactive.
   */
  private async handleSubscriptionDeleted(
    stripeSub: Record<string, unknown>,
    event:     Record<string, unknown>,
  ): Promise<void> {
    const customerId = stripeSub?.['customer'] as string;

    const subRepo = this.dataSource.getRepository(SubscriptionEntity);
    const sub = await subRepo
      .createQueryBuilder('sub')
      .where(`sub.features->>'stripeCustomerId' = :cid`, { cid: customerId })
      .getOne();

    if (!sub) {
      this.logger.warn(`subscription.deleted: no subscription found for customer ${customerId}`);
      return;
    }

    sub.status    = 'inactive';
    sub.endDate   = new Date().toISOString().slice(0, 10);
    sub.updatedAt = new Date();
    await subRepo.save(sub);

    this.logger.log(`SUBSCRIPTION_DEACTIVATED subId=${sub.id} companyId=${sub.companyId}`);
  }
}
