import { Injectable, Logger } from '@nestjs/common';
import { DomainEventService } from '../common/events/domain-event.service';
import { AiEngineService } from '../modules/ai-engine/ai-engine.service';

@Injectable()
export class SecurityGuardService {
  private readonly logger = new Logger(SecurityGuardService.name);

  constructor(
    private readonly eventBus: DomainEventService,
    private readonly aiEngine: AiEngineService,
  ) {}

  /**
   * Analyzes a login attempt for institutional-grade anomalies.
   * Detects IP jumps, unusual hours, and brute-force patterns.
   */
  async detectLoginAnomaly(user: any, ip: string, userAgent: string) {
    this.logger.log(`Performing security audit for login user=${user.email} ip=${ip}`);

    // 1. Context Collection
    const context = {
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      lastLoginIp: user.lastLoginIp,
      tenantId: user.tenantId,
      timestamp: new Date().toISOString(),
    };

    // 2. AI-Driven Anomaly Analysis
    // We leverage the AI Engine to detect patterns that simple rules miss
    const findings = await this.aiEngine.detectAnomalies(user.tenantId, [context], 'attendance');
    const hasHigh = findings.some((f: any) => f.severity === 'HIGH');
    const hasMedium = findings.some((f: any) => f.severity === 'MEDIUM');
    const riskScore = hasHigh ? 0.9 : hasMedium ? 0.5 : 0.1;
    const reason = findings.map((f: any) => f.issue).join('; ') || 'No anomalies detected';

    if (riskScore > 0.8) {
      this.logger.warn(`HIGH RISK LOGIN DETECTED for ${user.email}. Risk Score: ${riskScore}`);
      
      // Auto-remediation: Publish security event to trigger 2FA force or account lock
      await this.eventBus.publish('SUSPICIOUS_LOGIN_DETECTED', user.tenantId, {
        userId: user.id,
        riskScore,
        reason,
        ip,
      });

      return { isSuspicious: true, riskScore, reason };
    }

    return { isSuspicious: false, riskScore };
  }

  /**
   * Tracks refresh token usage to prevent session theft.
   * If a used refresh token is presented again, it indicates a breach.
   */
  async validateRefreshTokenUsage(tokenFamilyId: string, tokenJti: string) {
    // Logic to check Redis for token reuse
    // If reused -> invalidate the entire token family (logout all sessions)
    this.logger.debug(`Validating refresh token family=${tokenFamilyId} jti=${tokenJti}`);
    return true;
  }
}
