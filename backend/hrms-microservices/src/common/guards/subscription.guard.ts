import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';

export const SKIP_SUBSCRIPTION_CHECK = 'skipSubscriptionCheck';

/**
 * SubscriptionGuard
 *
 * Restricts API access when a tenant's subscription is inactive or past_due.
 * Must be applied AFTER JwtAuthGuard (requires req.user to be set).
 *
 * Active statuses: 'active', 'trialing'
 * Restricted: 'inactive', 'past_due', 'cancelled'
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, SubscriptionGuard)
 *
 * To bypass on specific routes (e.g. billing endpoints themselves):
 *   @SetMetadata(SKIP_SUBSCRIPTION_CHECK, true)
 *
 * Grace period:
 *   past_due → access allowed for SUBSCRIPTION_GRACE_DAYS (default: 3 days)
 *   This gives customers time to update payment before hard cutoff.
 *
 * Safety:
 *   If DB query fails, the guard logs and ALLOWS the request (fail-open).
 *   This prevents billing DB issues from locking out all users.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  // Grace period after payment failure before hard cutoff
  private readonly GRACE_DAYS =
    Number(process.env.SUBSCRIPTION_GRACE_DAYS ?? '3');

  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Allow bypass for routes that explicitly skip subscription check
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_CHECK, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const user    = request.user as { tenantId?: string; sub?: string } | undefined;

    if (!user?.tenantId) {
      // No tenant context — guard cannot enforce; allow through (auth guard handles this)
      return true;
    }

    try {
      const sub = await this.dataSource
        .getRepository(SubscriptionEntity)
        .createQueryBuilder('sub')
        .where('sub.company_id = :tenantId OR sub.tenant_id = :tenantId', {
          tenantId: user.tenantId,
        })
        .orderBy('sub.created_at', 'DESC')
        .getOne();

      // No subscription record → trial / new tenant → allow
      if (!sub) return true;

      // Active or trialing → allow
      if (['active', 'trialing'].includes(sub.status)) return true;

      // past_due → check grace period
      if (sub.status === 'past_due') {
        const cutoff = new Date(sub.updatedAt);
        cutoff.setDate(cutoff.getDate() + this.GRACE_DAYS);
        if (new Date() < cutoff) {
          this.logger.warn(
            `SUBSCRIPTION_GRACE_PERIOD tenantId=${user.tenantId} ` +
            `cutoff=${cutoff.toISOString()}`,
          );
          return true; // Within grace period
        }
        this.logger.warn(
          `SUBSCRIPTION_GRACE_EXPIRED tenantId=${user.tenantId} ` +
          `status=${sub.status}`,
        );
      }

      // Inactive / cancelled / expired grace → 402
      throw new HttpException(
        'Your subscription is inactive. Please update your payment method to continue.',
        HttpStatus.PAYMENT_REQUIRED,
      );

    } catch (err) {
      if (err instanceof HttpException && err.getStatus() === HttpStatus.PAYMENT_REQUIRED) throw err;
      // DB failure → fail-open (log + allow). Billing DB issues must NEVER lock out users.
      this.logger.error(
        `SUBSCRIPTION_GUARD_ERROR tenantId=${user?.tenantId} — ` +
        `failing open: ${(err as Error).message}`,
      );
      return true;
    }
  }
}
