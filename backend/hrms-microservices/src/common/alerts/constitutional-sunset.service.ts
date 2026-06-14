import { Injectable, Logger } from '@nestjs/common';

export interface SunsetRule {
  id:           string;
  createdAt:    string;
  lastRatified: string;
  expiryDate:   string;
  status:       'ACTIVE' | 'DECAYED' | 'EXPIRED';
}

/**
 * CONSTITUTIONAL SUNSET SERVICE — Phase ℵ-Final
 * 
 * The "Rule Decay Engine." 
 * Prevents institutional ossification by requiring periodic human 
 * ratification of coordination laws.
 */
@Injectable()
export class ConstitutionalSunsetService {
  private readonly logger = new Logger(ConstitutionalSunsetService.name);
  private rules: Map<string, SunsetRule> = new Map();

  /**
   * Registers a rule with a mandatory 6-month sunset clause.
   */
  registerRule(id: string) {
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(now.getMonth() + 6); // 6-month sunset

    this.rules.set(id, {
      id,
      createdAt:    now.toISOString(),
      lastRatified: now.toISOString(),
      expiryDate:   expiry.toISOString(),
      status:       'ACTIVE',
    });
  }

  /**
   * Checks if a rule has decayed or expired.
   */
  checkRule(id: string): 'ACTIVE' | 'DECAYED' | 'EXPIRED' {
    const rule = this.rules.get(id);
    if (!rule) return 'ACTIVE';

    const now = new Date();
    const expiry = new Date(rule.expiryDate);

    if (now > expiry) {
      this.logger.warn(`[Sunset] Rule ${id} has EXPIRED. It must be manually ratified.`);
      return 'EXPIRED';
    }

    // Decay warning (30 days before expiry)
    const decayBuffer = new Date(expiry);
    decayBuffer.setDate(expiry.getDate() - 30);
    if (now > decayBuffer) return 'DECAYED';

    return 'ACTIVE';
  }

  ratifyRule(id: string, operatorId: string) {
    const rule = this.rules.get(id);
    if (rule) {
      const now = new Date();
      const nextExpiry = new Date();
      nextExpiry.setMonth(now.getMonth() + 6);

      rule.lastRatified = now.toISOString();
      rule.expiryDate   = nextExpiry.toISOString();
      rule.status       = 'ACTIVE';
      this.logger.log(`[Sunset] Rule ${id} RATIFIED by ${operatorId}. Extended until ${nextExpiry.toISOString()}`);
    }
  }
}
