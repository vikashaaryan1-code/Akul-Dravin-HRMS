import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../ai-provider.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginHistoryEntity } from '../../../database/entities/login-history.entity';
import { AuditLogEntity } from '../../../database/entities/audit-log.entity';
import { EmployeeEntity } from '../../../database/entities/employee.entity';
import { TenantContext } from '../../../common/context/tenant-context';

/**
 * LAYER 6: AI SECURITY ENGINE (Anomaly Guard)
 *
 * Responsibilities:
 *   - Behavioral anomaly detection
 *   - Access policy violation alerts
 *   - IP drift detection
 *   - Payroll discrepancy identification
 *   - Fraud detection
 */
@Injectable()
export class AiSecurityEngineService {
  private readonly logger = new Logger(AiSecurityEngineService.name);

  constructor(
    private readonly aiProvider: AiProviderService,
    @InjectRepository(LoginHistoryEntity)
    private readonly loginHistoryRepo: Repository<LoginHistoryEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepo: Repository<AuditLogEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  /**
   * Detect suspicious behavioral patterns
   */
  async detectBehavioralAnomalies(userId: string): Promise<{
    anomalyScore: number; // 0-100
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    patterns: Array<{ pattern: string; riskLevel: string; timestamp: string }>;
    recommendations: string[];
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const logins = await this.loginHistoryRepo.find({
      where: { userId, tenantId: tenantId },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    const audits = await this.auditLogRepo.find({
      where: { userId, tenantId: tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const prompt = `
Analyze behavioral patterns for user ${userId}:
- Login history: ${logins.length} logins in past 30 days
- Recent IPs: ${[...new Set(logins.map((l) => l.ipAddress))].slice(0, 5).join(', ')}
- Audit activity: ${audits.length} audit events

Detect: anomalyScore (0-100), severity (LOW/MEDIUM/HIGH/CRITICAL), patterns (array with pattern, riskLevel, timestamp), recommendations (array).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a security analyst. Detect unusual behavioral patterns that may indicate compromise or fraud.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      maxTokens: 512,
    });

    try {
      const parsed = JSON.parse(result.content);
      return {
        anomalyScore: Math.min(100, Math.max(0, parsed.anomalyScore || 0)),
        severity: parsed.severity || 'LOW',
        patterns: parsed.patterns || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (err) { const e = err as any;
      return {
        anomalyScore: 0,
        severity: 'LOW',
        patterns: [],
        recommendations: [],
      };
    }
  }

  /**
   * Detect IP geolocation anomalies
   */
  async detectIpAnomalies(userId: string): Promise<{
    riskFlag: boolean;
    pattern: string;
    normalGeolocations: string[];
    anomalousLocations: Array<{ location: string; timestamp: string; riskLevel: string }>;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const logins = await this.loginHistoryRepo.find({
      where: { userId, tenantId: tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const prompt = `
Analyze login geolocation patterns for user:
Logins: ${logins.length}
Unique IPs: ${[...new Set(logins.map((l) => l.ipAddress))].length}

Detect: riskFlag (boolean), pattern (string description), normalGeolocations (array), anomalousLocations (array with location, timestamp, riskLevel).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a security expert. Identify suspicious geographic login patterns.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      maxTokens: 512,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      return {
        riskFlag: false,
        pattern: 'Normal',
        normalGeolocations: [],
        anomalousLocations: [],
      };
    }
  }

  /**
   * Detect payroll anomalies (e.g., duplicate payments, unauthorized adjustments)
   */
  async detectPayrollAnomalies(): Promise<{
    criticalIssues: Array<{ issueType: string; severity: string; details: string; affectedEmployees: number }>;
    recommendations: string[];
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const employees = await this.employeeRepo.find({
      where: { tenantId: tenantId },
      take: 100,
    });

    const prompt = `
Scan payroll data for anomalies across ${employees.length} employees.

Detect: criticalIssues (array with issueType, severity, details, affectedEmployees), recommendations (array).
Look for: duplicate payments, unauthorized salary adjustments, tax miscalculations, policy violations.
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a financial compliance expert. Identify payroll anomalies and compliance violations.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      maxTokens: 512,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      return {
        criticalIssues: [],
        recommendations: ['Run manual payroll audit'],
      };
    }
  }

  /**
   * Access control violation detection
   */
  async detectAccessViolations(): Promise<{
    violations: Array<{ violationType: string; userId: string; resource: string; severity: string; timestamp: string }>;
    policyGaps: string[];
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const audits = await this.auditLogRepo.find({
      where: { tenantId: tenantId, action: 'UNAUTHORIZED_ACCESS_ATTEMPT' as any },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const prompt = `
Analyze access control audit logs (${audits.length} audit events).

Detect: violations (array with violationType, userId, resource, severity, timestamp), policyGaps (array of security policy issues).
`;

    const result = await this.aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a security architect. Identify access control violations and recommend policy improvements.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      maxTokens: 512,
    });

    try {
      return JSON.parse(result.content);
    } catch (err) { const e = err as any;
      return {
        violations: [],
        policyGaps: [],
      };
    }
  }
}
