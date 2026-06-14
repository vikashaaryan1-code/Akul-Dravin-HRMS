import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginHistoryEntity, LoginEventType } from '../database/entities/login-history.entity';
import { RedisService } from '../redis/redis.service';

const MAX_ATTEMPTS  = 5;
const WINDOW_SECONDS = 15 * 60; // 15 min
const LOCKOUT_SECONDS = 30 * 60; // 30 min

@Injectable()
export class LoginGuardService {
  private readonly logger = new Logger(LoginGuardService.name);
  private readonly useRedis: boolean;

  constructor(
    @InjectRepository(LoginHistoryEntity)
    private readonly historyRepo: Repository<LoginHistoryEntity>,
    private readonly redis: RedisService,
  ) {
    this.useRedis = redis.isAvailable;
  }

  // ── Brute-force protection ─────────────────────────────────────────────────

  private brfKey(ip: string, email: string) {
    return `brf:${ip}:${Buffer.from(email).toString('base64url').slice(0, 32)}`;
  }

  private lockKey(ip: string, email: string) {
    return `lock:${ip}:${Buffer.from(email).toString('base64url').slice(0, 32)}`;
  }

  async isLockedOut(ip: string, email: string): Promise<boolean> {
    if (!this.useRedis) return false; // fail-open when Redis unavailable
    const locked = await this.redis.get(this.lockKey(ip, email));
    return !!locked;
  }

  async recordFailedAttempt(ip: string, email: string): Promise<{ locked: boolean; attemptsLeft: number }> {
    if (!this.useRedis) return { locked: false, attemptsLeft: MAX_ATTEMPTS };

    const key = this.brfKey(ip, email);
    const attempts = await this.redis.incr(key);
    if (attempts === 1) await this.redis.expire(key, WINDOW_SECONDS);

    if (attempts >= MAX_ATTEMPTS) {
      await this.redis.setEx(this.lockKey(ip, email), LOCKOUT_SECONDS, '1');
      this.logger.warn(`BRUTE_FORCE: Account locked for ${email} from IP ${ip} after ${attempts} attempts`);
      return { locked: true, attemptsLeft: 0 };
    }
    return { locked: false, attemptsLeft: MAX_ATTEMPTS - attempts };
  }

  async clearFailedAttempts(ip: string, email: string): Promise<void> {
    if (!this.useRedis) return;
    await this.redis.del(this.brfKey(ip, email));
  }

  // ── Login History ──────────────────────────────────────────────────────────

  async record(payload: {
    userId: string;
    tenantId?: string | null;
    eventType: LoginEventType;
    ip?: string;
    userAgent?: string;
    deviceName?: string;
    failureReason?: string;
    sessionId?: string;
  }): Promise<void> {
    try {
      await this.historyRepo.save(
        this.historyRepo.create({
          userId: payload.userId,
          tenantId: payload.tenantId ?? null,
          eventType: payload.eventType,
          ipAddress: payload.ip ?? null,
          userAgent: payload.userAgent ?? null,
          deviceName: payload.deviceName ?? null,
          failureReason: payload.failureReason ?? null,
          sessionId: payload.sessionId ?? null,
        }),
      );
    } catch (err) {
      this.logger.warn(`LoginGuardService: Failed to record login history: ${String(err)}`);
    }
  }

  async getHistory(userId: string, limit = 20): Promise<LoginHistoryEntity[]> {
    return this.historyRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentFailures(userId: string, minutes = 60): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.historyRepo
      .createQueryBuilder('lh')
      .where('lh.user_id = :userId AND lh.event_type = :type AND lh.created_at >= :since', {
        userId, type: 'FAILURE', since,
      })
      .getCount();
  }
}
